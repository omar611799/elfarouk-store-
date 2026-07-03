import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import { getSlotLockId, isBookingStatusActive } from './_lib/serviceSlots.js'

const ALLOWED_STATUSES = new Set(['new', 'confirmed', 'cancelled', 'completed'])
const ALLOWED_PAYMENT_STATUSES = new Set([
  'pending',
  'proof_submitted',
  'paid',
  'rejected',
  'failed',
])

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '')
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

function normalizeText(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength)
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

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const bookingId = normalizeText(req.body?.bookingId, 80)
    const nextStatus = req.body?.status ? normalizeText(req.body.status, 40) : null
    const nextPaymentStatus = req.body?.paymentStatus
      ? normalizeText(req.body.paymentStatus, 40)
      : null
    const paymentReviewNote = normalizeText(req.body?.paymentReviewNote, 240)

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' })
    }

    if (!nextStatus && !nextPaymentStatus) {
      return res.status(400).json({ error: 'No updates were provided' })
    }

    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      return res.status(400).json({ error: 'Status is invalid' })
    }

    if (nextPaymentStatus && !ALLOWED_PAYMENT_STATUSES.has(nextPaymentStatus)) {
      return res.status(400).json({ error: 'Payment status is invalid' })
    }

    const bookingRef = db.collection('serviceBookings').doc(bookingId)
    const bookingSnap = await bookingRef.get()
    if (!bookingSnap.exists) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookingSnap.data()
    const updates = {
      updatedAt: adminTimestamp(),
    }

    if (nextStatus) {
      updates.status = nextStatus
    }

    if (nextPaymentStatus) {
      updates.paymentStatus = nextPaymentStatus
      updates.paymentReviewNote = paymentReviewNote
      if (nextPaymentStatus === 'proof_submitted') {
        updates.paymentSubmittedAt = adminTimestamp()
        updates.paymentReviewedAt = null
        updates.paymentReviewedByUid = ''
        updates.paymentReviewedByName = ''
      } else {
        updates.paymentReviewedAt = adminTimestamp()
        updates.paymentReviewedByUid = decoded.uid
        updates.paymentReviewedByName = userSnap.exists ? userSnap.data().name || '' : ''
      }
    }

    const slotLockRef = db.collection('serviceSlotLocks').doc(getSlotLockId(booking.day, booking.slot))
    const customerLockRef = booking.customerAuthUid
      ? db.collection('customerServiceLocks').doc(booking.customerAuthUid)
      : null

    const batch = db.batch()
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
          day: booking.day,
          slot: booking.slot,
          updatedAt: adminTimestamp(),
        },
        { merge: true }
      )

      if (customerLockRef) {
        batch.set(
          customerLockRef,
          {
            bookingId,
            day: booking.day,
            slot: booking.slot,
            updatedAt: adminTimestamp(),
          },
          { merge: true }
        )
      }
    } else if (nextStatus && customerLockRef) {
      batch.delete(customerLockRef)
    }

    if (booking.customerAuthUid && (nextStatus || nextPaymentStatus)) {
      const bodyParts = []
      if (nextStatus) bodyParts.push(`الحالة: ${nextStatus}`)
      if (nextPaymentStatus) bodyParts.push(`الدفع: ${nextPaymentStatus}`)
      if (paymentReviewNote) bodyParts.push(`ملاحظة: ${paymentReviewNote}`)

      const notificationRef = db.collection('notifications').doc()
      batch.set(notificationRef, {
        type: 'booking_updated',
        audience: 'customer',
        bookingId,
        customerAuthUid: booking.customerAuthUid,
        title: 'تم تحديث حالة الحجز',
        body: bodyParts.join(' | '),
        read: false,
        createdAt: adminTimestamp(),
        updatedAt: adminTimestamp(),
      })
    }

    await batch.commit()

    return res.status(200).json({ ok: true, bookingId })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update booking' })
  }
}
