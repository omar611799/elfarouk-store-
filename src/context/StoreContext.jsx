import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  listenCol, listenColLimited, COLS, addProduct, updateProduct, deleteProduct,
  addCategory, deleteCategory, addSupplier, updateSupplier, deleteSupplier,
  addCustomer, updateCustomer, deleteCustomer,
  updateProductStock, addTransaction, completeSale,
  payInvoiceDebt, deleteInvoiceAndReturnStock, returnInvoiceItems,
  addQuote, deleteQuote, importProductsBatch,
  addExpense, deleteExpense, recordPurchase, paySupplierDebt
} from '../firebase/collections'

const StoreContext = createContext(null)

const init = {
  products: [], categories: [], suppliers: [],
  customers: [], invoices: [], transactions: [], expenses: [], quotes: [], purchases: [],
  loading: true,
  cart: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET': return { ...state, [action.key]: action.data }
    case 'LOADING': return { ...state, loading: action.value }
    case 'CART_ADD': {
      const ex = state.cart.find(i => i.id === action.item.id)
      if (ex) return { ...state, cart: state.cart.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i) }
      return { ...state, cart: [...state.cart, { ...action.item, qty: 1 }] }
    }
    case 'CART_QTY':
      if (action.qty < 1) return { ...state, cart: state.cart.filter(i => i.id !== action.id) }
      return { ...state, cart: state.cart.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) }
    case 'CART_REMOVE': return { ...state, cart: state.cart.filter(i => i.id !== action.id) }
    case 'CART_CLEAR': return { ...state, cart: [] }
    default: return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  // ── Real-time listeners (Staggered for performance) ──
  useEffect(() => {
    const unsubs = [];

    // Stage 1: Critical Data (Immediate)
    const sub1 = [
      listenCol(COLS.PRODUCTS, data => {
        dispatch({ type: 'SET', key: 'products', data })
        dispatch({ type: 'LOADING', value: false }) // Initial bridge to UI
      }),
      listenCol(COLS.CATEGORIES, data => dispatch({ type: 'SET', key: 'categories', data }))
    ];
    unsubs.push(...sub1);

    // Stage 2: CRM & Partners (Delay 1s)
    const stage2Timer = setTimeout(() => {
      unsubs.push(listenCol(COLS.SUPPLIERS, data => dispatch({ type: 'SET', key: 'suppliers', data })));
      unsubs.push(listenCol(COLS.CUSTOMERS, data => dispatch({ type: 'SET', key: 'customers', data })));
    }, 1000);

    // Stage 3: Heavy History (Delay 2.5s)
    const stage3Timer = setTimeout(() => {
      unsubs.push(listenColLimited(COLS.INVOICES, data => dispatch({ type: 'SET', key: 'invoices', data }), 100));
      unsubs.push(listenColLimited(COLS.QUOTATIONS, data => dispatch({ type: 'SET', key: 'quotes', data }), 50));
      unsubs.push(listenColLimited(COLS.TRANSACTIONS, data => dispatch({ type: 'SET', key: 'transactions', data }), 100));
      unsubs.push(listenColLimited(COLS.EXPENSES, data => dispatch({ type: 'SET', key: 'expenses', data }), 100));
      unsubs.push(listenColLimited(COLS.PURCHASES, data => dispatch({ type: 'SET', key: 'purchases', data }), 50));
    }, 2500);
    
    return () => {
      unsubs.forEach(u => typeof u === 'function' && u());
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
    }
  }, [])

  // ── Products ──
  const handleAddProduct = async (data) => {
    try {
      await addProduct(data)
      toast.success('تمت إضافة القطعة')
    } catch (e) { toast.error(e.message) }
  }
  const handleUpdateProduct = async (id, data) => {
    try {
      await updateProduct(id, data)
      toast.success('تم تحديث القطعة')
    } catch (e) { toast.error(e.message) }
  }
  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id)
      toast.success('تم حذف القطعة')
    } catch (e) { toast.error(e.message) }
  }

  // ── Categories ──
  const handleAddCategory = async (data) => {
    try { await addCategory(data); toast.success('تمت إضافة الفئة') }
    catch (e) { toast.error(e.message) }
  }
  const handleDeleteCategory = async (id) => {
    try { await deleteCategory(id); toast.success('تم حذف الفئة') }
    catch (e) { toast.error(e.message) }
  }

  // ── Suppliers ──
  const handleAddSupplier = async (data) => {
    try { await addSupplier(data); toast.success('تمت إضافة المورد') }
    catch (e) { toast.error(e.message) }
  }
  const handleUpdateSupplier = async (id, data) => {
    try { await updateSupplier(id, data); toast.success('تم تحديث المورد') }
    catch (e) { toast.error(e.message) }
  }
  const handleDeleteSupplier = async (id) => {
    try { await deleteSupplier(id); toast.success('تم حذف المورد') }
    catch (e) { toast.error(e.message) }
  }

  // ── Customers ──
  const handleAddCustomer = async (data) => {
    try { await addCustomer(data); toast.success('تمت إضافة العميل') }
    catch (e) { toast.error(e.message) }
  }
  const handleUpdateCustomer = async (id, data) => {
    try { await updateCustomer(id, data); toast.success('تم تحديث العميل') }
    catch (e) { toast.error(e.message) }
  }
  const handleDeleteCustomer = async (id) => {
    try { await deleteCustomer(id); toast.success('تم حذف العميل') }
    catch (e) { toast.error(e.message) }
  }

  // ── Expenses ──
  const handleAddExpense = async (data) => {
    try { await addExpense(data); toast.success('تم تسجيل المصروف بنجاح') }
    catch (e) { toast.error(e.message) }
  }
  const handleDeleteExpense = async (id) => {
    try { await deleteExpense(id); toast.success('تم حذف المصروف') }
    catch (e) { toast.error(e.message) }
  }

  // ── Stock ──
  const stockIn = async (productId, qty, note = '') => {
    try {
      await updateProductStock(productId, qty, 'stock_in', note)
      await addTransaction({ type: 'stockIn', refId: productId, details: `استلام ${qty} قطعة${note ? ' - ' + note : ''}`, amount: qty })
      toast.success(`تمت إضافة ${qty} قطعة`)
    } catch (e) { toast.error(e.message) }
  }

  const stockOut = async (productId, qty, reason = '') => {
    const prod = state.products.find(p => p.id === productId)
    if (!prod || prod.quantity < qty) { toast.error('الكمية غير متوفرة'); return }
    try {
      await updateProductStock(productId, -qty, 'stock_out', reason)
      await addTransaction({ type: 'stockOut', refId: productId, details: `صرف ${qty} قطعة${reason ? ' - ' + reason : ''}`, amount: qty })
      toast.success(`تم صرف ${qty} قطعة`)
    } catch (e) { toast.error(e.message) }
  }

  // ── Sale ──
  const handleCompleteSale = async (params) => {
    try {
      const id = await completeSale(params)
      dispatch({ type: 'CART_CLEAR' })
      toast.success('تم إتمام البيع بنجاح')
      return id
    } catch (e) { toast.error(e.message); throw e }
  }

  const handlePayInvoiceDebt = async (invoiceId, amount, note) => {
    try {
      await payInvoiceDebt(invoiceId, amount, note)
      toast.success('تم تسجيل سداد المديونية بنجاح')
    } catch (e) { toast.error(e.message); throw e }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoiceAndReturnStock(invoiceId)
      toast.success('تم حذف الفاتورة واسترداد المخزون بنجاح')
    } catch (e) { toast.error(e.message); throw e }
  }

  const handleReturnItems = async (params) => {
    try {
      await returnInvoiceItems(params)
      toast.success('تم إرجاع القطع وتسوية المبالغ بنجاح')
    } catch (e) { toast.error(e.message); throw e }
  }

  const handleSaveQuote = async (data) => {
    try {
      const id = await addQuote(data);
      toast.success('تم حفظ عرض السعر بنجاح');
      return id;
    } catch (e) { toast.error(e.message); throw e }
  }

  const handleDeleteQuote = async (id) => {
    try {
      await deleteQuote(id);
      toast.success('تم مسح عرض السعر');
    } catch (e) { toast.error(e.message); throw e }
  }

  const handleImportProductsBatch = async (products) => {
    try {
      const res = await importProductsBatch(products);
      toast.success(`تم بنجاح! إضافة: ${res.addedCount} | تحديث: ${res.updatedCount}`);
      return res;
    } catch (e) { toast.error(e.message); throw e }
  }

  // ── Purchases ──
  const handleRecordPurchase = async (data) => {
    try {
      await recordPurchase(data);
      toast.success('تم تسجيل فاتورة الشراء وتحديث المخزون');
    } catch (e) { toast.error(e.message); throw e }
  }

  const handlePaySupplierDebt = async (supplierId, amount, note) => {
    try {
      await paySupplierDebt(supplierId, amount, note);
      toast.success('تم تسجيل سداد المورد بنجاح');
    } catch (e) { toast.error(e.message); throw e }
  }

  // ── Cart ──
  const cartAdd = (item) => dispatch({ type: 'CART_ADD', item })
  const cartQty = (id, qty) => dispatch({ type: 'CART_QTY', id, qty })
  const cartRemove = (id) => dispatch({ type: 'CART_REMOVE', id })
  const cartClear = () => dispatch({ type: 'CART_CLEAR' })
  const cartTotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0)

  return (
    <StoreContext.Provider value={{
      ...state, cartTotal, cartCount,
      addProduct: handleAddProduct,
      updateProduct: handleUpdateProduct,
      deleteProduct: handleDeleteProduct,
      addCategory: handleAddCategory,
      deleteCategory: handleDeleteCategory,
      addSupplier: handleAddSupplier,
      updateSupplier: handleUpdateSupplier,
      deleteSupplier: handleDeleteSupplier,
      addCustomer: handleAddCustomer,
      updateCustomer: handleUpdateCustomer,
      deleteCustomer: handleDeleteCustomer,
      stockIn, stockOut,
      completeSale: handleCompleteSale,
      payInvoiceDebt: handlePayInvoiceDebt,
      deleteInvoice: handleDeleteInvoice,
      returnInvoiceItems: handleReturnItems,
      saveQuote: handleSaveQuote,
      deleteQuote: handleDeleteQuote,
      importProductsBatch: handleImportProductsBatch,
      addExpense: handleAddExpense,
      deleteExpense: handleDeleteExpense,
      recordPurchase: handleRecordPurchase,
      paySupplierDebt: handlePaySupplierDebt,
      cartAdd, cartQty, cartRemove, cartClear,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
