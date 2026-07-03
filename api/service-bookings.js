import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import {
  SERVICE_SLOTS,
  getReservedSlotsForDay,
  getSlotLockId,
  isBookingStatusActive,
  isSlotReserved,
} from './_lib/serviceSlots.js'

const SLOT_PRICE = 50
const PAYMENT_LINK = 'https://ipn.eg/01115329887'

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '')
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

function normalizeText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizePhone(value) {
  return String(value || '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/\D/g, '')
    .slice(0, 15)
}

function isValidDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(token)
    const userSnap = await db.collection('users').doc(decoded.uid).get()
    const userRole = userSnap.exists ? userSnap.data().role : null

    if (userRole !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' })
    }

    const name = normalizeText(req.body?.name, 80)
    const phone = normalizePhone(req.body?.phone)
    const carModel = normalizeText(req.body?.carModel, 80)
    const notes = normalizeText(req.body?.notes, 500)
    const day = normalizeText(req.body?.day, 10)
    const slot = normalizeText(req.body?.slot, 40)

    if (!name) return res.status(400).json({ error: 'Name is required' })
    if (phone.length < 10) return res.status(400).json({ error: 'Phone is invalid' })
    if (!isValidDay(day)) return res.status(400).json({ error: 'Day is invalid' })
    if (!SERVICE_SLOTS.includes(slot)) {
      return res.status(400).json({ error: 'Slot is invalid' })
    }

    const existingSnap = await db
      .collection('serviceBookings')
      .where('customerAuthUid', '==', decoded.uid)
      .get()

    const existingActive = existingSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .find((booking) => isBookingStatusActive(booking.status))

    if (existingActive) {
      return res.status(200).json({
        id: existingActive.id,
        alreadyExists: true,
      })
    }

    const customerLockRef = db.collection('customerServiceLocks').doc(decoded.uid)
    const customerLockSnap = await customerLockRef.get()
    if (customerLockSnap.exists) {
      return res.status(409).json({ error: 'يوجد حجز نشط بالفعل على حسابك' })
    }

    const reserved = await getReservedSlotsForDay(db, day)
    if (isSlotReserved(reserved, slot)) {
      return res.status(409).json({ error: 'هذا الموعد تم حجزه بالفعل' })
    }

    const bookingRef = db.collection('serviceBookings').doc()
    const messageRef = db.collection('serviceMessages').doc()
    const notificationRef = db.collection('notifications').doc()
    const slotLockRef = db.collection('serviceSlotLocks').doc(getSlotLockId(day, slot))

    await db.runTransaction(async (transaction) => {
      const [slotLockSnap, customerLockInTx] = await Promise.all([
        transaction.get(slotLockRef),
        transaction.get(customerLockRef),
      ])

      if (customerLockInTx.exists) {
        throw new Error('ACTIVE_BOOKING_EXISTS')
      }

      if (slotLockSnap.exists) {
        throw new Error('SLOT_ALREADY_RESERVED')
      }

      transaction.set(bookingRef, {
        name,
        phone,
        carModel,
        notes,
        day,
        slot,
        customerAuthUid: decoded.uid,
        slotPrice: SLOT_PRICE,
        paymentLink: PAYMENT_LINK,
        paymentStatus: 'pending',
        status: 'new',
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })

      transaction.set(slotLockRef, {
        bookingId: bookingRef.id,
        day,
        slot,
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })

      transaction.set(customerLockRef, {
        bookingId: bookingRef.id,
        day,
        slot,
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })

      transaction.set(messageRef, {
        bookingId: bookingRef.id,
        customerAuthUid: decoded.uid,
        sender: 'system',
        text: `تم فتح الشات. للدفع: InstaPay/محفظة على رقم 01115329887 بمبلغ 50 جنيه، ثم أرسل لقطة التحويل هنا.`,
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })

      transaction.set(notificationRef, {
        type: 'booking_created',
        audience: 'admin',
        bookingId: bookingRef.id,
        customerAuthUid: decoded.uid,
        title: 'حجز صيانة جديد',
        body: `${name} - ${phone} | ${day} | ${slot}`,
        read: false,
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })
    })

    return res.status(201).json({
      id: bookingRef.id,
      alreadyExists: false,
    })
  } catch (error) {
    if (error.message === 'SLOT_ALREADY_RESERVED') {
      return res.status(409).json({ error: 'هذا الموعد تم حجزه بالفعل' })
    }

    if (error.message === 'ACTIVE_BOOKING_EXISTS') {
      return res.status(409).json({ error: 'يوجد حجز نشط بالفعل على حسابك' })
    }

    return res.status(500).json({ error: error.message || 'Failed to create booking' })
  }
}
