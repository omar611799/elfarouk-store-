import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from './config'

export const COLS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  TRANSACTIONS: 'transactions',
}

// ── Real-time listeners (onSnapshot) ──
export function listenCol(col, callback) {
  const q = query(collection(db, col), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── CRUD ──
export async function addDoc_(col, data) {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateDoc_(col, id, data) {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteDoc_(col, id) {
  await deleteDoc(doc(db, col, id))
}

export async function getDoc_(col, id) {
  const snap = await getDoc(doc(db, col, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Products ──
export const addProduct    = (d) => addDoc_(COLS.PRODUCTS, d)
export const updateProduct = (id, d) => updateDoc_(COLS.PRODUCTS, id, d)
export const deleteProduct = (id) => deleteDoc_(COLS.PRODUCTS, id)

export async function updateProductStock(productId, delta) {
  const p = await getDoc_(COLS.PRODUCTS, productId)
  if (!p) throw new Error('المنتج غير موجود')
  const newQty = Math.max(0, (p.quantity || 0) + delta)
  await updateDoc_(COLS.PRODUCTS, productId, { quantity: newQty })
  return newQty
}

// ── Categories ──
export const addCategory    = (d) => addDoc_(COLS.CATEGORIES, d)
export const updateCategory = (id, d) => updateDoc_(COLS.CATEGORIES, id, d)
export const deleteCategory = (id) => deleteDoc_(COLS.CATEGORIES, id)

// ── Suppliers ──
export const addSupplier    = (d) => addDoc_(COLS.SUPPLIERS, d)
export const updateSupplier = (id, d) => updateDoc_(COLS.SUPPLIERS, id, d)
export const deleteSupplier = (id) => deleteDoc_(COLS.SUPPLIERS, id)

// ── Customers ──
export const addCustomer    = (d) => addDoc_(COLS.CUSTOMERS, d)
export const updateCustomer = (id, d) => updateDoc_(COLS.CUSTOMERS, id, d)
export const deleteCustomer = (id) => deleteDoc_(COLS.CUSTOMERS, id)

export async function findCustomerByPhone(phone) {
  const q = query(collection(db, COLS.CUSTOMERS), where('phone', '==', phone))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── Invoices ──
export const addInvoice = (d) => addDoc_(COLS.INVOICES, d)
export const getInvoice = (id) => getDoc_(COLS.INVOICES, id)

// ── Transactions ──
export const addTransaction = (d) => addDoc_(COLS.TRANSACTIONS, d)

// ── Complete Sale (atomic) ──
export async function completeSale({ cartItems, customerData, total, invoiceNumber }) {
  const paidAmount = Number(customerData.paidAmount ?? total)
  const dueAmount  = Math.max(0, total - paidAmount)
  const paymentStatus = dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'

  const batch = writeBatch(db)

  // Deduct stock
  for (const item of cartItems) {
    const p = await getDoc_(COLS.PRODUCTS, item.id)
    const newQty = Math.max(0, (p?.quantity || 0) - item.qty)
    batch.update(doc(db, COLS.PRODUCTS, item.id), {
      quantity: newQty,
      updatedAt: serverTimestamp(),
    })
  }

  // Save invoice
  const invRef = doc(collection(db, COLS.INVOICES))
  batch.set(invRef, {
    number: invoiceNumber,
    items: cartItems,
    total,
    customerData,
    paidAmount,
    dueAmount,
    paymentStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Save transaction
  const txRef = doc(collection(db, COLS.TRANSACTIONS))
  batch.set(txRef, {
    type: 'sale',
    refId: invRef.id,
    details: `فاتورة ${invoiceNumber} - ${customerData.name}`,
    amount: total,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  // Update or create customer
  const existing = await findCustomerByPhone(customerData.phone)
  if (existing) {
    await updateCustomer(existing.id, {
      name: customerData.name,
      totalSpent:   (existing.totalSpent || 0) + total,
      invoiceCount: (existing.invoiceCount || 0) + 1,
      debtTotal:    Math.max(0, (existing.debtTotal || 0) + dueAmount),
      paidTotal:    (existing.paidTotal || 0) + paidAmount,
    })
  } else {
    await addCustomer({
      ...customerData,
      totalSpent: total,
      invoiceCount: 1,
      paidTotal: paidAmount,
      debtTotal: dueAmount,
    })
  }

  return invRef.id
}
