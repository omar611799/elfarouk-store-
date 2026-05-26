import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'
import {
  getPublicApiErrorStatus,
  normalizePhone,
  serializeCustomerRecord,
  serializeInvoiceSnapshot,
} from './_lib/publicData.js'

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '')
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const phone = normalizePhone(req.query?.phone)
  if (phone.length < 10) {
    return res.status(400).json({ error: 'A valid phone number is required' })
  }

  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(token)
    const [userSnap, accountSnap] = await Promise.all([
      db.collection('users').doc(decoded.uid).get(),
      db.collection('customerAccounts').doc(decoded.uid).get(),
    ])

    const userRole = userSnap.exists ? userSnap.data().role : null
    const userPhone = normalizePhone(
      userSnap.data()?.phone || accountSnap.data()?.phone || ''
    )

    if (userRole !== 'admin' && userRole !== 'customer') {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (userRole === 'customer' && userPhone !== phone) {
      return res.status(403).json({ error: 'You can only access your own portal' })
    }

    const [customerSnap, invoiceSnap] = await Promise.all([
      db.collection('customers').where('phone', '==', phone).limit(1).get(),
      db.collection('invoices').where('customerData.phone', '==', phone).get(),
    ])

    const invoices = invoiceSnap.docs
      .map(serializeInvoiceSnapshot)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    let customer = null

    if (!customerSnap.empty) {
      customer = serializeCustomerRecord(customerSnap.docs[0].data(), phone)
    } else if (invoices.length > 0) {
      customer = {
        ...serializeCustomerRecord(invoices[0].customerData, phone),
        totalSpent: invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
        invoiceCount: invoices.length,
        debtTotal: invoices.reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0),
        paidTotal: invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0),
      }
    }

    if (!customer && invoices.length === 0) {
      return res.status(404).json({ error: 'Customer portal data not found' })
    }

    return res.status(200).json({
      phone,
      customer,
      invoices,
    })
  } catch (error) {
    return res
      .status(getPublicApiErrorStatus(error))
      .json({ error: error.message || 'Failed to load customer portal data' })
  }
}
