export const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']

export function getSlotLockId(day, slot) {
  return `${day}__${slot}`
}

export function isActiveBookingStatus(status) {
  return status !== 'cancelled'
}

export function isBookingStatusActive(status) {
  return status === 'new' || status === 'confirmed'
}

export async function getReservedSlotsForDay(db, day) {
  const [lockSnap, bookingSnap] = await Promise.all([
    db.collection('serviceSlotLocks').where('day', '==', day).get(),
    db.collection('serviceBookings').where('day', '==', day).get(),
  ])

  const reserved = new Set()

  lockSnap.forEach((docSnap) => {
    const slot = docSnap.data()?.slot
    if (SERVICE_SLOTS.includes(slot)) {
      reserved.add(slot)
    }
  })

  bookingSnap.forEach((docSnap) => {
    const data = docSnap.data()
    if (isActiveBookingStatus(data.status) && SERVICE_SLOTS.includes(data.slot)) {
      reserved.add(data.slot)
    }
  })

  return reserved
}

export function formatSlotAvailability(day, reserved) {
  const reservedSlots = SERVICE_SLOTS.filter((slot) => reserved.has(slot))
  const availableSlots = SERVICE_SLOTS.filter((slot) => !reserved.has(slot))
  return { day, reservedSlots, availableSlots }
}

export function isSlotReserved(reserved, slot) {
  return reserved.has(slot)
}
