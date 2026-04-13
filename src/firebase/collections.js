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
  EXPENSES: 'expenses',
  QUOTATIONS: 'quotations',
  USERS: 'users',
  STOCK_LOGS: 'stockLogs',
  PURCHASES: 'purchases',
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

export async function updateProductStock(productId, delta, type = 'manual', note = '', refId = '') {
  const p = await getDoc_(COLS.PRODUCTS, productId)
  if (!p) throw new Error('المنتج غير موجود')
  const newQty = Math.max(0, (p.quantity || 0) + delta)
  await updateDoc_(COLS.PRODUCTS, productId, { quantity: newQty })
  
  // Log the change
  await addDoc_(COLS.STOCK_LOGS, {
    productId,
    productName: p.name,
    type,
    delta,
    newQty,
    note,
    refId,
    createdAt: serverTimestamp()
  })
  
  return newQty
}

export async function logStockChange(batch, { productId, productName, type, delta, newQty, note, refId }) {
  const logRef = doc(collection(db, COLS.STOCK_LOGS))
  batch.set(logRef, {
    productId,
    productName,
    type,
    delta,
    newQty,
    note,
    refId,
    createdAt: serverTimestamp()
  })
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

// ── Expenses ──
export const addExpense = (d) => addDoc_(COLS.EXPENSES, d)
export const deleteExpense = (id) => deleteDoc_(COLS.EXPENSES, id)

// ── Complete Sale (atomic) ──
export async function completeSale({ cartItems, customerData, total, invoiceNumber }) {
  let paidAmount = 0;
  let paymentsBreakdown = {};

  if (customerData.payments) {
    paymentsBreakdown = customerData.payments;
    paidAmount = Number(paymentsBreakdown.cash || 0) + Number(paymentsBreakdown.visa || 0) + Number(paymentsBreakdown.instapay || 0);
  } else {
    paidAmount = Number(customerData.paidAmount ?? total);
    paymentsBreakdown = { cash: paidAmount };
  }

  const dueAmount  = Math.max(0, total - paidAmount)
  const paymentStatus = dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'

  const batch = writeBatch(db)
  const invRef = doc(collection(db, COLS.INVOICES))

  // Deduct stock and Log
  for (const item of cartItems) {
    const p = await getDoc_(COLS.PRODUCTS, item.id)
    const newQty = Math.max(0, (p?.quantity || 0) - Number(item.qty))
    batch.update(doc(db, COLS.PRODUCTS, item.id), {
      quantity: newQty,
      updatedAt: serverTimestamp(),
    })
    
    // Internal Stock Log
    const logRef = doc(collection(db, COLS.STOCK_LOGS))
    batch.set(logRef, {
      productId: item.id,
      productName: item.name,
      type: 'sale',
      delta: -item.qty,
      newQty,
      refId: invRef.id,
      note: `فاتورة رقم ${invoiceNumber}`,
      createdAt: serverTimestamp()
    })
  }

  // Save invoice (Enrich items with current cost for profit calculation)
  const enrichedItems = cartItems.map(item => ({
    ...item,
    cost: item.cost || 0 // cost should be passed from POS
  }))

  batch.set(invRef, {
    number: invoiceNumber,
    items: enrichedItems,
    total,
    customerData,
    paidAmount,
    payments: paymentsBreakdown,
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

// ── Delete Invoice (Return stock) ──
export async function deleteInvoiceAndReturnStock(invoiceId) {
  const inv = await getDoc_(COLS.INVOICES, invoiceId);
  if (!inv) throw new Error('الفاتورة غير موجودة');

  const batch = writeBatch(db);

  // Return stock
  for (const item of (inv.items || [])) {
    const p = await getDoc_(COLS.PRODUCTS, item.id);
    if (p) {
      const newQty = (p.quantity || 0) + item.qty;
      batch.update(doc(db, COLS.PRODUCTS, item.id), {
        quantity: newQty,
        updatedAt: serverTimestamp(),
      });
      // Log reversal
      logStockChange(batch, {
        productId: item.id,
        productName: item.name,
        type: 'return_deleted_invoice',
        delta: item.qty,
        newQty,
        note: `حذف الفاتورة رقم ${inv.number}`,
        refId: invoiceId
      });
    }
  }

  // Deduct from customer if applicable
  if (inv.customerData?.phone) {
    const existing = await findCustomerByPhone(inv.customerData.phone);
    if (existing) {
      batch.update(doc(db, COLS.CUSTOMERS, existing.id), {
        totalSpent: Math.max(0, (existing.totalSpent || 0) - (inv.total || 0)),
        invoiceCount: Math.max(0, (existing.invoiceCount || 0) - 1),
        debtTotal: Math.max(0, (existing.debtTotal || 0) - (inv.dueAmount || 0)),
        paidTotal: Math.max(0, (existing.paidTotal || 0) - (inv.paidAmount || 0)),
      });
    }
  }

  // Delete invoice
  batch.delete(doc(db, COLS.INVOICES, invoiceId));

  // Add a transaction for the cancellation
  const txRef = doc(collection(db, COLS.TRANSACTIONS));
  batch.set(txRef, {
    type: 'invoice_deleted',
    refId: invoiceId,
    details: `استرداد مخزون وحذف فاتورة - رقم ${inv.number}`,
    amount: -(inv.total || 0),
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

// ── Pay Debt ──
export async function payInvoiceDebt(invoiceId, paymentAmount, note) {
  const inv = await getDoc_(COLS.INVOICES, invoiceId);
  if (!inv) throw new Error('الفاتورة غير موجودة');

  const payment = Number(paymentAmount);
  if (payment <= 0 || payment > inv.dueAmount) throw new Error('مبلغ السداد غير منطقي');

  const newPaidAmount = (inv.paidAmount || 0) + payment;
  const newDueAmount = Math.max(0, (inv.dueAmount || 0) - payment);
  const paymentStatus = newDueAmount === 0 ? 'paid' : 'partial';

  const newPaymentsBreakdown = { ...(inv.payments || {}) };
  // Add payment to cash by default representing debt collected to drawer
  newPaymentsBreakdown.cash = (Number(newPaymentsBreakdown.cash) || 0) + payment;

  const batch = writeBatch(db);

  batch.update(doc(db, COLS.INVOICES, invoiceId), {
    paidAmount: newPaidAmount,
    dueAmount: newDueAmount,
    paymentStatus,
    payments: newPaymentsBreakdown,
    updatedAt: serverTimestamp(),
  });

  if (inv.customerData?.phone) {
    const existing = await findCustomerByPhone(inv.customerData.phone);
    if (existing) {
      batch.update(doc(db, COLS.CUSTOMERS, existing.id), {
        debtTotal: Math.max(0, (existing.debtTotal || 0) - payment),
        paidTotal: (existing.paidTotal || 0) + payment,
      });
    }
  }

  const txRef = doc(collection(db, COLS.TRANSACTIONS));
  batch.set(txRef, {
    type: 'debt_collection',
    refId: invoiceId,
    details: `تحصيل سداد من آجل الفاتورة ${inv.number}${note ? ' - ' + note : ''}`,
    amount: payment,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

// ── Partial Return ──
export async function returnInvoiceItems({ invoiceId, itemsToReturn }) {
  const inv = await getDoc_(COLS.INVOICES, invoiceId);
  if (!inv) throw new Error('الفاتورة غير موجودة');

  const batch = writeBatch(db);
  let refundValue = 0;
  
  // Create a copy of the items to modify
  const newItems = [...(inv.items || [])];

  // Restock products and update invoice mapped items
  for (const retItem of itemsToReturn) {
    if (retItem.qty <= 0) continue;

    const itemIndex = newItems.findIndex(i => i.id === retItem.id);
    if (itemIndex === -1) continue;

    const originalItem = newItems[itemIndex];
    const availableToReturn = originalItem.qty - (originalItem.returnedQty || 0);
    
    if (retItem.qty > availableToReturn) {
      throw new Error(`لا يمكن إرجاع كمية لـ ${originalItem.name} أكبر من المشتراة.`);
    }

    // Update item line
    newItems[itemIndex] = {
      ...originalItem,
      returnedQty: (originalItem.returnedQty || 0) + retItem.qty
    };

    refundValue += (originalItem.price * retItem.qty);

    // Increase product stock
    const p = await getDoc_(COLS.PRODUCTS, retItem.id);
    if (p) {
      batch.update(doc(db, COLS.PRODUCTS, retItem.id), {
        quantity: Math.max(0, (p.quantity || 0) + retItem.qty),
        updatedAt: serverTimestamp(),
      });
    }
  }

  if (refundValue === 0) return; // Nothing was actually returned

  // Financial recalculation
  const oldDueAmount = inv.dueAmount || 0;
  const oldPaidAmount = inv.paidAmount || 0;
  const newTotal = Math.max(0, (inv.total || 0) - refundValue);

  let newDueAmount = oldDueAmount;
  let newPaidAmount = oldPaidAmount;
  let cashRefunded = 0;

  if (oldDueAmount > 0) {
    if (oldDueAmount >= refundValue) {
      newDueAmount -= refundValue;
    } else {
      cashRefunded = refundValue - oldDueAmount;
      newDueAmount = 0;
      newPaidAmount = Math.max(0, oldPaidAmount - cashRefunded);
    }
  } else {
    cashRefunded = refundValue;
    newPaidAmount = Math.max(0, oldPaidAmount - cashRefunded);
  }

  // Determine new payment status
  const paymentStatus = (newTotal === 0 && newDueAmount === 0) ? 'paid' 
                      : (newDueAmount === 0) ? 'paid' 
                      : (newPaidAmount > 0) ? 'partial' : 'unpaid';

  // Adjust invoice breakdown if cash was refunded
  const newPaymentsBreakdown = { ...(inv.payments || {}) };
  if (cashRefunded > 0) {
    newPaymentsBreakdown.cash = Math.max(0, (Number(newPaymentsBreakdown.cash) || 0) - cashRefunded);
  }

  // Update Invoice
  batch.update(doc(db, COLS.INVOICES, invoiceId), {
    items: newItems,
    total: newTotal,
    dueAmount: newDueAmount,
    paidAmount: newPaidAmount,
    paymentStatus,
    payments: newPaymentsBreakdown,
    updatedAt: serverTimestamp(),
  });

  // Calculate debt and paid drops to apply to Customer
  const debtDrop = oldDueAmount - newDueAmount;
  const paidDrop = oldPaidAmount - newPaidAmount;

  if (inv.customerData?.phone) {
    const existing = await findCustomerByPhone(inv.customerData.phone);
    if (existing) {
      batch.update(doc(db, COLS.CUSTOMERS, existing.id), {
        totalSpent: Math.max(0, (existing.totalSpent || 0) - refundValue),
        debtTotal: Math.max(0, (existing.debtTotal || 0) - debtDrop),
        paidTotal: Math.max(0, (existing.paidTotal || 0) - paidDrop),
      });
    }
  }

  // Create a transaction for the return
  let txDetails = `مرتجع جزئي للفاتورة ${inv.number}.`;
  if (cashRefunded > 0) txDetails += ` رد نقدية: ${cashRefunded} ج.م.`;
  if (debtDrop > 0) txDetails += ` خصم آجل: ${debtDrop} ج.م.`;

  const txRef = doc(collection(db, COLS.TRANSACTIONS));
  batch.set(txRef, {
    type: 'return',
    refId: invoiceId,
    details: txDetails,
    amount: -refundValue,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

// ── Quotations (عروض الأسعار) ──
export const addQuote = (d) => addDoc_(COLS.QUOTATIONS, d)
export const deleteQuote = (id) => deleteDoc_(COLS.QUOTATIONS, id)

// ── Bulk Import Excel (استيراد مجمع) ──
export async function importProductsBatch(productsData) {
  // We chunk batches of 500 for Firestore limit
  const chunkSize = 400; 
  let addedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < productsData.length; i += chunkSize) {
    const chunk = productsData.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const item of chunk) {
      if (!item.name) continue; // safety

      // check if exists by SKU or Exact Name
      let existsRefId = null;
      
      const qSku = item.sku ? query(collection(db, COLS.PRODUCTS), where('sku', '==', item.sku)) : null;
      if (qSku) {
        const snap = await getDocs(qSku);
        if (!snap.empty) existsRefId = snap.docs[0].id;
      }
      
      if (!existsRefId) {
        const qName = query(collection(db, COLS.PRODUCTS), where('name', '==', item.name));
        const snap = await getDocs(qName);
        if (!snap.empty) existsRefId = snap.docs[0].id;
      }

      if (existsRefId) {
        // Update price and quantity
        batch.update(doc(db, COLS.PRODUCTS, existsRefId), {
          price: Number(item.price) || 0,
          cost: Number(item.cost) || 0,
          quantity: Number(item.quantity) || 0,
          category: item.category || '',
          updatedAt: serverTimestamp()
        });
        updatedCount++;
      } else {
        // Add new
        const docRef = doc(collection(db, COLS.PRODUCTS));
        batch.set(docRef, {
          name: item.name,
          sku: item.sku || '',
          price: Number(item.price) || 0,
          cost: Number(item.cost) || 0,
          quantity: Number(item.quantity) || 0,
          category: item.category || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        addedCount++;
      }
    }
    
    await batch.commit();
  }
  
  return { addedCount, updatedCount };
}

// ── Purchases & Supplier Ledger ──
export async function recordPurchase({ supplierId, items, total, paidAmount, billNumber }) {
  const dueAmount = Math.max(0, total - paidAmount);
  const batch = writeBatch(db);

  // 1. Save Purchase Record
  const purchaseRef = doc(collection(db, COLS.PURCHASES));
  batch.set(purchaseRef, {
    supplierId,
    billNumber,
    items,
    total,
    paidAmount,
    dueAmount,
    createdAt: serverTimestamp(),
  });

  // 2. Update Stock and Log
  for (const item of items) {
    const p = await getDoc_(COLS.PRODUCTS, item.id);
    const newQty = (p?.quantity || 0) + item.qty;
    batch.update(doc(db, COLS.PRODUCTS, item.id), {
      quantity: newQty,
      cost: Number(item.cost), // Update product cost to latest purchase price
      updatedAt: serverTimestamp(),
    });

    logStockChange(batch, {
      productId: item.id,
      productName: item.name,
      type: 'purchase',
      delta: item.qty,
      newQty,
      refId: purchaseRef.id,
      note: `شراء من مورد - فاتورة ${billNumber}`,
    });
  }

  // 3. Update Supplier Debt
  const s = await getDoc_(COLS.SUPPLIERS, supplierId);
  if (s) {
    batch.update(doc(db, COLS.SUPPLIERS, supplierId), {
      debtTotal: (s.debtTotal || 0) + dueAmount,
      totalPurchases: (s.totalPurchases || 0) + total,
      updatedAt: serverTimestamp(),
    });
  }

  // 4. Register Transaction
  const txRef = doc(collection(db, COLS.TRANSACTIONS));
  batch.set(txRef, {
    type: 'purchase',
    refId: purchaseRef.id,
    details: `شراء بضاعة - فاتورة ${billNumber}`,
    amount: -paidAmount, // Negative because money going out
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function paySupplierDebt(supplierId, amount, note = '') {
  const s = await getDoc_(COLS.SUPPLIERS, supplierId);
  if (!s) throw new Error('المورد غير موجود');

  const payment = Number(amount);
  const batch = writeBatch(db);

  batch.update(doc(db, COLS.SUPPLIERS, supplierId), {
    debtTotal: Math.max(0, (s.debtTotal || 0) - payment),
    updatedAt: serverTimestamp(),
  });

  const txRef = doc(collection(db, COLS.TRANSACTIONS));
  batch.set(txRef, {
    type: 'supplier_payment',
    refId: supplierId,
    details: `سداد للمورد: ${s.name}${note ? ' - ' + note : ''}`,
    amount: -payment,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

