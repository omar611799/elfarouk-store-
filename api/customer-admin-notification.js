import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'

const ALLOWED_TYPES = new Set(['new_message'])
const MAX_NOTIFICATIONS_PER_HOUR = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

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
      return res.status(401).json({ error: 'Authentication required' })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(token)
    const userSnap = await db.collection('users').doc(decoded.uid).get()
    const user = userSnap.exists ? userSnap.data() : null

    if (!user || user.role !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' })
    }

    const phoneStatus = user.phoneVerificationStatus
    if (phoneStatus && phoneStatus !== 'verified') {
      return res.status(403).json({ error: 'Phone verification required' })
    }

    const type = normalizeText(req.body?.type, 40)
    const bookingId = normalizeText(req.body?.bookingId, 80)
    const title = normalizeText(req.body?.title, 120)
    const body = normalizeText(req.body?.body, 240)

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: 'Notification type is not allowed' })
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' })
    }

    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    const bookingSnap = await db.collection('serviceBookings').doc(bookingId).get()
    if (!bookingSnap.exists) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookingSnap.data()
    if (booking.customerAuthUid !== decoded.uid) {
      return res.status(403).json({ error: 'You can only notify for your own booking' })
    }

    const ipLimit = await checkRateLimit({
      scope: 'customer_admin_notification_ip',
      identifier: getClientIp(req),
      maxAttempts: 30,
      windowMs: RATE_WINDOW_MS,
    })

    if (!ipLimit.allowed) {
      return res.status(429).json({
        error: `تجاوزت الحد المسموح. حاول بعد ${ipLimit.retryAfterSeconds} ثانية`,
      })
    }

    const userLimit = await checkRateLimit({
      scope: 'customer_admin_notification_uid',
      identifier: decoded.uid,
      maxAttempts: MAX_NOTIFICATIONS_PER_HOUR,
      windowMs: RATE_WINDOW_MS,
    })

    if (!userLimit.allowed) {
      return res.status(429).json({
        error: `تجاوزت حد الإشعارات. حاول بعد ${userLimit.retryAfterSeconds} ثانية`,
      })
    }

    const notificationRef = await db.collection('notifications').add({
      type,
      audience: 'admin',
      bookingId,
      customerAuthUid: decoded.uid,
      title,
      body,
      read: false,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    return res.status(201).json({ ok: true, id: notificationRef.id })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create notification' })
  }
}
