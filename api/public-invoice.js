import { getAdminDb } from './_lib/firebaseAdmin.js'
import { getPublicApiErrorStatus, serializeInvoiceSnapshot } from './_lib/publicData.js'

function normalizeId(value) {
  return String(value || '').trim().slice(0, 120)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const id = normalizeId(req.query?.id)
  if (!id) {
    return res.status(400).json({ error: 'Invoice id is required' })
  }

  try {
    const db = getAdminDb()
    const snapshot = await db.collection('invoices').doc(id).get()

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    return res.status(200).json({
      invoice: serializeInvoiceSnapshot(snapshot),
    })
  } catch (error) {
    return res
      .status(getPublicApiErrorStatus(error))
      .json({ error: error.message || 'Failed to load invoice' })
  }
}
