import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLS } from '../firebase/collections'
import {
  SERVICE_PAYMENT_STATUSES,
  isBookingStatusActive,
} from '../utils/serviceBooking'

export { isBookingStatusActive } from '../utils/serviceBooking'

const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']
const SLOT_PRICE = 50

const LOGIN_REQUIRED_MESSAGE = 'يجب تسجيل الدخول أولًا'
const CUSTOMER_REQUIRED_MESSAGE = 'حساب العميل فقط هو المسموح له بإتمام الحجز'
const ADMIN_REQUIRED_MESSAGE = 'صلاحية الأدمن مطلوبة'
const ACTIVE_BOOKING_MESSAGE = 'يوجد حجز نشط بالفعل على حسابك'
const SLOT_RESERVED_MESSAGE = 'هذا الموعد تم حجزه بالفعل'

const ALLOWED_STATUSES = new Set(['new', 'confirmed', 'cancelled', 'completed'])
const ALLOWED_PAYMENT_STATUSES = new Set([
  SERVICE_PAYMENT_STATUSES.PENDING,
  SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED,
  SERVICE_PAYMENT_STATUSES.PAID,
  SERVICE_PAYMENT_STATUSES.REJECTED,
  SERVICE_PAYMENT_STATUSES.FAILED,
])

function normalizeText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeDigits(value) {
  return String(value || '').replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
}

function normalizePhone(value) {
  return normalizeDigits(value).replace(/\D/g, '').slice(0, 15)
}

function isValidDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day)
}

function getSlotLockId(day, slot) {
  return `${day}__${slot}`
}

async function getSignedInUser() {
  const user = auth.currentUser
  if (!user) throw new Error(LOGIN_REQUIRED_MESSAGE)
  return user
}

async function getUserRole(uid) {
  const userSnap = await getDoc(doc(db, COLS.USERS, uid))
  return userSnap.exists() ? userSnap.data().role : null
}

async function requireUserRole(expectedRole, message) {
  const user = await getSignedInUser()
  const role = await getUserRole(user.uid)
  if (role !== expectedRole) {
    throw new Error(message)
  }
  return user
}

async function findExistingActiveBooking(uid) {
  const snap = await getDocs(
    query(
      collection(db, COLS.SERVICE_BOOKINGS),
      where('customerAuthUid', '==', uid),
      limit(20)
    )
  )

  return (
    snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .find((booking) => isBookingStatusActive(booking.status)) || null
  )
}

export async function fetchServiceSlotAvailability(day) {
  const normalizedDay = normalizeText(day, 10)
  if (!isValidDay(normalizedDay)) {
    throw new Error('يجب اختيار يوم صحيح')
  }

  await getSignedInUser()

  const params = new URLSearchParams({ day: normalizedDay })
  const response = await fetch(`/api/service-slots?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'تعذر تحميل المواعيد')
  }

  return payload
}

export async function createServiceBooking(payload) {
  const user = await requireUserRole('customer', CUSTOMER_REQUIRED_MESSAGE)

  const existingActive = await findExistingActiveBooking(user.uid)
  if (existingActive) {
    return { id: existingActive.id, alreadyExists: true }
  }

  const name = normalizeText(payload?.name, 80)
  const phone = normalizePhone(payload?.phone)
  const carModel = normalizeText(payload?.carModel, 80)
  const notes = normalizeText(payload?.notes, 500)
  const day = normalizeText(payload?.day, 10)
  const slot = normalizeText(payload?.slot, 40)
  const paymentLink = normalizeText(payload?.paymentLink, 240)

  if (!name) throw new Error('الاسم مطلوب')
  if (phone.length < 10) throw new Error('رقم الهاتف غير صحيح')
  if (!isValidDay(day)) throw new Error('اليوم غير صحيح')
  if (!SERVICE_SLOTS.includes(slot)) throw new Error('الموعد غير صحيح')

  const availability = await fetchServiceSlotAvailability(day)
  if (availability.reservedSlots.includes(slot)) {
    throw new Error(SLOT_RESERVED_MESSAGE)
  }

  const bookingRef = doc(collection(db, COLS.SERVICE_BOOKINGS))
  const notificationRef = doc(collection(db, COLS.NOTIFICATIONS))
  const slotLockRef = doc(db, COLS.SERVICE_SLOT_LOCKS, getSlotLockId(day, slot))
  const customerLockRef = doc(db, COLS.CUSTOMER_SERVICE_LOCKS, user.uid)

  try {
    await runTransaction(db, async (transaction) => {
      const customerLockSnap = await transaction.get(customerLockRef)
      if (customerLockSnap.exists()) {
        const error = new Error(ACTIVE_BOOKING_MESSAGE)
        error.code = 'ACTIVE_BOOKING_EXISTS'
        error.bookingId = customerLockSnap.data()?.bookingId || ''
        throw error
      }

      const slotLockSnap = await transaction.get(slotLockRef)
      if (slotLockSnap.exists()) {
        const error = new Error(SLOT_RESERVED_MESSAGE)
        error.code = 'SLOT_ALREADY_RESERVED'
        throw error
      }



      transaction.set(bookingRef, {
        name,
        phone,
        carModel,
        notes,
        day,
        slot,
        customerAuthUid: user.uid,
        slotPrice: SLOT_PRICE,
        paymentLink,
        paymentStatus: SERVICE_PAYMENT_STATUSES.PENDING,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      transaction.set(slotLockRef, {
        bookingId: bookingRef.id,
        day,
        slot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      transaction.set(customerLockRef, {
        bookingId: bookingRef.id,
        day,
        slot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      transaction.set(notificationRef, {
        type: 'booking_created',
        audience: 'admin',
        bookingId: bookingRef.id,
        customerAuthUid: user.uid,
        title: 'حجز صيانة جديد',
        body: `${name} - ${phone} | ${day} | ${slot}`,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    if (error.code === 'ACTIVE_BOOKING_EXISTS') {
      return { id: error.bookingId || existingActive?.id || '', alreadyExists: true }
    }

    if (error.code === 'SLOT_ALREADY_RESERVED') {
      throw new Error(SLOT_RESERVED_MESSAGE)
    }

    throw error
  }

  return { id: bookingRef.id, alreadyExists: false }
}

export async function updateServiceBookingAdmin(payload) {
  await requireUserRole('admin', ADMIN_REQUIRED_MESSAGE)

  const bookingId = normalizeText(payload?.bookingId, 80)
  const nextStatus = payload?.status ? normalizeText(payload.status, 40) : null
  const nextPaymentStatus = payload?.paymentStatus
    ? normalizeText(payload.paymentStatus, 40)
    : null
  const paymentReviewNote = payload?.paymentReviewNote
    ? normalizeText(payload.paymentReviewNote, 240)
    : ''
  const actorUid = normalizeText(payload?.actorUid, 80)
  const actorName = normalizeText(payload?.actorName, 120)

  if (!bookingId) {
    throw new Error('رقم الحجز مطلوب')
  }

  if (!nextStatus && !nextPaymentStatus) {
    throw new Error('لا توجد تحديثات لإرسالها')
  }

  if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
    throw new Error('حالة الحجز غير صحيحة')
  }

  if (nextPaymentStatus && !ALLOWED_PAYMENT_STATUSES.has(nextPaymentStatus)) {
    throw new Error('حالة الدفع غير صحيحة')
  }

  const bookingRef = doc(db, COLS.SERVICE_BOOKINGS, bookingId)
  const bookingSnap = await getDoc(bookingRef)
  if (!bookingSnap.exists()) {
    throw new Error('الحجز غير موجود')
  }

  const booking = bookingSnap.data()
  const updates = {
    updatedAt: serverTimestamp(),
  }

  if (nextStatus) {
    updates.status = nextStatus
  }

  if (nextPaymentStatus) {
    updates.paymentStatus = nextPaymentStatus
    updates.paymentReviewNote = paymentReviewNote
    if (nextPaymentStatus === SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED) {
      updates.paymentSubmittedAt = serverTimestamp()
      updates.paymentReviewedAt = null
      updates.paymentReviewedByUid = ''
      updates.paymentReviewedByName = ''
      updates.paymentReviewNote = ''
    } else {
      updates.paymentReviewedAt = serverTimestamp()
      updates.paymentReviewedByUid = actorUid
      updates.paymentReviewedByName = actorName
    }
  }

  const batch = writeBatch(db)
  const slotLockRef = doc(
    db,
    COLS.SERVICE_SLOT_LOCKS,
    getSlotLockId(booking.day || '', booking.slot || '')
  )

  const customerLockRef = booking.customerAuthUid
    ? doc(db, COLS.CUSTOMER_SERVICE_LOCKS, booking.customerAuthUid)
    : null

  batch.update(bookingRef, updates)

  if (nextStatus === 'cancelled') {
    batch.delete(slotLockRef)
    if (customerLockRef) {
      batch.delete(customerLockRef)
    }
  } else if (nextStatus && isBookingStatusActive(nextStatus)) {
    batch.set(
      slotLockRef,
      {
        bookingId,
        day: booking.day || '',
        slot: booking.slot || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    if (customerLockRef) {
      batch.set(
        customerLockRef,
        {
          bookingId,
          day: booking.day || '',
          slot: booking.slot || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
  } else if (nextStatus && customerLockRef) {
    batch.delete(customerLockRef)
  }

  if (booking.customerAuthUid && (nextStatus || nextPaymentStatus)) {
    const notificationRef = doc(collection(db, COLS.NOTIFICATIONS))
    const bodyParts = []

    if (nextStatus) bodyParts.push(`الحالة: ${nextStatus}`)
    if (nextPaymentStatus) bodyParts.push(`الدفع: ${nextPaymentStatus}`)

    batch.set(notificationRef, {
      type: 'booking_updated',
      audience: 'customer',
      bookingId,
      customerAuthUid: booking.customerAuthUid,
      title: 'تم تحديث حالة الحجز',
      body: bodyParts.join(' | '),
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()

  return { ok: true, bookingId }
}
