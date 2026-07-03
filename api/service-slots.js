import { getAdminDb } from './_lib/firebaseAdmin.js'
import {
  formatSlotAvailability,
  getReservedSlotsForDay,
} from './_lib/serviceSlots.js'

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
    const reserved = await getReservedSlotsForDay(db, day)
    return res.status(200).json(formatSlotAvailability(day, reserved))
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load slots' })
  }
}
