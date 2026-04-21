import crypto from 'node:crypto'
import { getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'

function verifySignature({ bookingId, status, transactionId, amount, signature }) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) return true
  const base = `${bookingId}|${status}|${transactionId || ''}|${amount || ''}`
  const expected = crypto.createHmac('sha256', secret).update(base).digest('hex')
  return signature === expected
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const {
      bookingId,
      status,
      transactionId = '',
      amount = 0,
      provider = 'unknown',
      signature = '',
    } = req.body || {}

    if (!bookingId || !status) {
      return res.status(400).json({ error: 'bookingId and status are required' })
    }

    if (!verifySignature({ bookingId, status, transactionId, amount, signature })) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const db = getAdminDb()
    const bookingRef = db.collection('serviceBookings').doc(String(bookingId))
    const bookingSnap = await bookingRef.get()
    if (!bookingSnap.exists) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const paymentStatus = status === 'success' ? 'paid' : 'failed'
    const booking = bookingSnap.data()

    await bookingRef.update({
      paymentStatus,
      paymentProvider: provider,
      paymentTransactionId: String(transactionId || ''),
      paymentAmount: Number(amount || 0),
      paidAt: paymentStatus === 'paid' ? adminTimestamp() : null,
      updatedAt: adminTimestamp(),
    })

    const customerAuthUid = booking.customerAuthUid || null
    await db.collection('serviceMessages').add({
      bookingId: String(bookingId),
      customerAuthUid,
      sender: 'system',
      text: paymentStatus === 'paid'
        ? 'تم تأكيد الدفع تلقائيا من بوابة الدفع.'
        : 'فشل الدفع أو تم إلغاؤه. يرجى المحاولة مرة أخرى.',
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    await db.collection('notifications').add({
      type: 'payment_webhook',
      audience: paymentStatus === 'paid' ? 'customer' : 'admin',
      bookingId: String(bookingId),
      customerAuthUid,
      title: paymentStatus === 'paid' ? 'تم تأكيد الدفع' : 'تنبيه عملية دفع',
      body: `provider=${provider}, tx=${transactionId || '-'}, status=${paymentStatus}`,
      read: false,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    return res.status(200).json({ ok: true, bookingId, paymentStatus })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Webhook processing failed' })
  }
}
