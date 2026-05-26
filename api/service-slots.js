import { getAdminDb } from './_lib/firebaseAdmin.js'

const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']

function isValidDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const day = String(req.query?.day || '').trim()
  if (!isValidDay(day)) {
    return res.status(400).json({ error: 'A valid day is required' })
  }

  try {
    const db = getAdminDb()
    const [lockSnap, bookingSnap] = await Promise.all([
      db.collection('serviceSlotLocks').where('day', '==', day).get(),
      db.collection('serviceBookings').where('day', '==', day).get(),
    ])

    const reserved = new Set()

    lockSnap.forEach((docSnap) => {
      const data = docSnap.data()
      if (SERVICE_SLOTS.includes(data.slot)) {
        reserved.add(data.slot)
      }
    })

    bookingSnap.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.status !== 'cancelled' && SERVICE_SLOTS.includes(data.slot)) {
        reserved.add(data.slot)
      }
    })

    const reservedSlots = SERVICE_SLOTS.filter((slot) => reserved.has(slot))
    const availableSlots = SERVICE_SLOTS.filter((slot) => !reserved.has(slot))

    return res.status(200).json({
      day,
      reservedSlots,
      availableSlots,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load slots' })
  }
}
