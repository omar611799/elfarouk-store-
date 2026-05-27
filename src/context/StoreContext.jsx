/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer } from 'react'
import toast from 'react-hot-toast'
import {
  listenCol,
  listenColLimited,
  listenColByField,
  listenDocById,
  COLS,
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  deleteCategory,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  updateProductStock,
  addTransaction,
  completeSale,
  payInvoiceDebt,
  deleteInvoiceAndReturnStock,
  returnInvoiceItems,
  addQuote,
  deleteQuote,
  importProductsBatch,
  addExpense,
  deleteExpense,
  recordPurchase,
  paySupplierDebt,
  recordSupplierReturn,
  updateServiceBooking,
  addServiceMessage,
  addNotification,
  markNotificationAsRead,
  adjustCustomerWallet,
  reviewCustomerAccount,
} from '../firebase/collections'
import { createServiceBooking, updateServiceBookingAdmin } from '../services/serviceBookingApi'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

const init = {
  products: [],
  categories: [],
  suppliers: [],
  customers: [],
  invoices: [],
  transactions: [],
  expenses: [],
  quotes: [],
  purchases: [],
  supplierReturns: [],
  serviceBookings: [],
  serviceMessages: [],
  notifications: [],
  customerWallets: [],
  customerAccounts: [],
  loading: true,
  cart: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.key]: action.data }
    case 'LOADING':
      return { ...state, loading: action.value }
    case 'CART_ADD': {
      const existing = state.cart.find((item) => item.id === action.item.id)
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === action.item.id ? { ...item, qty: item.qty + 1 } : item
          ),
        }
      }
      return { ...state, cart: [...state.cart, { ...action.item, qty: 1 }] }
    }
    case 'CART_QTY':
      if (action.qty < 1) {
        return { ...state, cart: state.cart.filter((item) => item.id !== action.id) }
      }
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.id ? { ...item, qty: action.qty } : item
        ),
      }
    case 'CART_REMOVE':
      return { ...state, cart: state.cart.filter((item) => item.id !== action.id) }
    case 'CART_CLEAR':
      return { ...state, cart: [] }
    default:
      return state
  }
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
    const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
    return bDate - aDate
  })
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)
  const { currentUser } = useAuth()
  const isAdminUser = currentUser?.role === 'admin'
  const isCashierUser = currentUser?.role === 'cashier'
  const isStaffUser = isAdminUser || isCashierUser

  useEffect(() => {
    const unsubs = []

    if (isStaffUser) {
      const primarySubs = [
        listenCol(COLS.PRODUCTS, (data) => {
          dispatch({ type: 'SET', key: 'products', data })
          setTimeout(() => dispatch({ type: 'LOADING', value: false }), 100)
        }),
        listenCol(COLS.CATEGORIES, (data) =>
          dispatch({ type: 'SET', key: 'categories', data })
        ),
      ]
      unsubs.push(...primarySubs)
    } else {
      dispatch({ type: 'LOADING', value: false })
    }

    const stage2Timer = setTimeout(() => {
      if (!isStaffUser) return
      unsubs.push(
        listenCol(COLS.SUPPLIERS, (data) => dispatch({ type: 'SET', key: 'suppliers', data }))
      )
      unsubs.push(
        listenCol(COLS.CUSTOMERS, (data) => dispatch({ type: 'SET', key: 'customers', data }))
      )
    }, 1000)

    const stage3Timer = setTimeout(() => {
      if (isAdminUser) {
        unsubs.push(
          listenColLimited(COLS.INVOICES, (data) =>
            dispatch({ type: 'SET', key: 'invoices', data })
          , 100)
        )
        unsubs.push(
          listenColLimited(COLS.QUOTATIONS, (data) =>
            dispatch({ type: 'SET', key: 'quotes', data })
          , 50)
        )
        unsubs.push(
          listenColLimited(COLS.TRANSACTIONS, (data) =>
            dispatch({ type: 'SET', key: 'transactions', data })
          , 100)
        )
        unsubs.push(
          listenColLimited(COLS.EXPENSES, (data) =>
            dispatch({ type: 'SET', key: 'expenses', data })
          , 100)
        )
        unsubs.push(
          listenColLimited(COLS.PURCHASES, (data) =>
            dispatch({ type: 'SET', key: 'purchases', data })
          , 50)
        )
        unsubs.push(
          listenColLimited(COLS.SUPPLIER_RETURNS, (data) =>
            dispatch({ type: 'SET', key: 'supplierReturns', data: sortByCreatedAtDesc(data) })
          , 50)
        )
        unsubs.push(
          listenColLimited(COLS.SERVICE_BOOKINGS, (data) =>
            dispatch({ type: 'SET', key: 'serviceBookings', data: sortByCreatedAtDesc(data) })
          , 100)
        )
        unsubs.push(
          listenColLimited(COLS.SERVICE_MESSAGES, (data) =>
            dispatch({ type: 'SET', key: 'serviceMessages', data: sortByCreatedAtDesc(data) })
          , 300)
        )
        unsubs.push(
          listenColLimited(COLS.NOTIFICATIONS, (data) =>
            dispatch({ type: 'SET', key: 'notifications', data: sortByCreatedAtDesc(data) })
          , 300)
        )
        unsubs.push(
          listenColLimited(COLS.CUSTOMER_WALLETS, (data) =>
            dispatch({ type: 'SET', key: 'customerWallets', data })
          , 300)
        )
        unsubs.push(
          listenColLimited(COLS.CUSTOMER_ACCOUNTS, (data) =>
            dispatch({ type: 'SET', key: 'customerAccounts', data: sortByCreatedAtDesc(data) })
          , 300)
        )
      } else if (isCashierUser) {
        unsubs.push(
          listenColLimited(COLS.INVOICES, (data) =>
            dispatch({ type: 'SET', key: 'invoices', data })
          , 100)
        )
      } else if (currentUser?.role === 'customer' && currentUser?.uid) {
        unsubs.push(
          listenColByField(COLS.SERVICE_BOOKINGS, 'customerAuthUid', currentUser.uid, (data) =>
            dispatch({ type: 'SET', key: 'serviceBookings', data: sortByCreatedAtDesc(data) })
          , 100)
        )
        unsubs.push(
          listenColByField(COLS.SERVICE_MESSAGES, 'customerAuthUid', currentUser.uid, (data) =>
            dispatch({ type: 'SET', key: 'serviceMessages', data: sortByCreatedAtDesc(data) })
          , 300)
        )
        unsubs.push(
          listenColByField(COLS.NOTIFICATIONS, 'customerAuthUid', currentUser.uid, (data) =>
            dispatch({ type: 'SET', key: 'notifications', data: sortByCreatedAtDesc(data) })
          , 300)
        )
        unsubs.push(
          listenDocById(COLS.CUSTOMER_WALLETS, currentUser.uid, (data) =>
            dispatch({ type: 'SET', key: 'customerWallets', data: data ? [data] : [] })
          )
        )
        unsubs.push(
          listenDocById(COLS.CUSTOMER_ACCOUNTS, currentUser.uid, (data) =>
            dispatch({ type: 'SET', key: 'customerAccounts', data: data ? [data] : [] })
          )
        )
      }
    }, 2500)

    return () => {
      unsubs.forEach((unsub) => typeof unsub === 'function' && unsub())
      clearTimeout(stage2Timer)
      clearTimeout(stage3Timer)
    }
  }, [currentUser?.role, currentUser?.uid, isAdminUser, isCashierUser, isStaffUser])

  const handleAddProduct = async (data) => {
    try {
      await addProduct(data)
      toast.success('تمت إضافة القطعة')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateProduct = async (id, data) => {
    try {
      await updateProduct(id, data)
      toast.success('تم تحديث القطعة')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id)
      toast.success('تم حذف القطعة')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddCategory = async (data) => {
    try {
      await addCategory(data)
      toast.success('تمت إضافة الفئة')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id)
      toast.success('تم حذف الفئة')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddSupplier = async (data) => {
    try {
      await addSupplier(data)
      toast.success('تمت إضافة المورد')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateSupplier = async (id, data) => {
    try {
      await updateSupplier(id, data)
      toast.success('تم تحديث المورد')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id)
      toast.success('تم حذف المورد')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddCustomer = async (data) => {
    try {
      await addCustomer(data)
      toast.success('تمت إضافة العميل')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateCustomer = async (id, data) => {
    try {
      await updateCustomer(id, data)
      toast.success('تم تحديث العميل')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteCustomer = async (id) => {
    try {
      await deleteCustomer(id)
      toast.success('تم حذف العميل')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddExpense = async (data) => {
    try {
      await addExpense(data)
      toast.success('تم تسجيل المصروف بنجاح')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id)
      toast.success('تم حذف المصروف')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const stockIn = async (productId, qty, note = '') => {
    try {
      await updateProductStock(productId, qty, 'stock_in', note)
      await addTransaction({
        type: 'stockIn',
        refId: productId,
        details: `استلام ${qty} قطعة${note ? ` - ${note}` : ''}`,
        amount: qty,
      })
      toast.success(`تمت إضافة ${qty} قطعة`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const stockOut = async (productId, qty, reason = '') => {
    const product = state.products.find((item) => item.id === productId)
    if (!product || product.quantity < qty) {
      toast.error('الكمية غير متوفرة')
      return
    }

    try {
      await updateProductStock(productId, -qty, 'stock_out', reason)
      await addTransaction({
        type: 'stockOut',
        refId: productId,
        details: `صرف ${qty} قطعة${reason ? ` - ${reason}` : ''}`,
        amount: qty,
      })
      toast.success(`تم صرف ${qty} قطعة`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCompleteSale = async (params) => {
    try {
      // Attach cashier info to be saved with the invoice
      const enrichedCustomerData = {
        ...params.customerData,
        _cashier: { uid: currentUser?.uid || '', name: currentUser?.name || '' },
      }
      const id = await completeSale({ ...params, customerData: enrichedCustomerData })
      dispatch({ type: 'CART_CLEAR' })
      toast.success('تم إتمام البيع بنجاح')
      return id
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handlePayInvoiceDebt = async (invoiceId, amount, note) => {
    try {
      await payInvoiceDebt(invoiceId, amount, note)
      toast.success('تم تسجيل سداد المديونية بنجاح')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoiceAndReturnStock(invoiceId)
      toast.success('تم حذف الفاتورة واسترداد المخزون بنجاح')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleReturnItems = async (params) => {
    try {
      await returnInvoiceItems(params)
      toast.success('تم إرجاع القطع وتسوية المبالغ بنجاح')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleSaveQuote = async (data) => {
    try {
      const id = await addQuote(data)
      toast.success('تم حفظ عرض السعر بنجاح')
      return id
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteQuote = async (id) => {
    try {
      await deleteQuote(id)
      toast.success('تم مسح عرض السعر')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleImportProductsBatch = async (products) => {
    try {
      const result = await importProductsBatch(products)
      toast.success(`تم بنجاح! إضافة: ${result.addedCount} | تحديث: ${result.updatedCount}`)
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleRecordPurchase = async (data) => {
    try {
      await recordPurchase(data)
      toast.success('تم تسجيل فاتورة الشراء وتحديث المخزون')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleRecordSupplierReturn = async (data) => {
    try {
      await recordSupplierReturn({
        ...data,
        cashierUid: currentUser?.uid || '',
        cashierName: currentUser?.name || '',
      })
      toast.success('تم تسجيل المرتجع وتحديث المخزون بنجاح')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handlePaySupplierDebt = async (supplierId, amount, note) => {
    try {
      await paySupplierDebt(supplierId, amount, note)
      toast.success('تم تسجيل سداد المورد بنجاح')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleAddServiceBooking = async (data) => {
    try {
      const result = await createServiceBooking(data)
      if (!result.alreadyExists) {
        toast.success('تم تسجيل الحجز بنجاح')
      }
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleUpdateServiceBooking = async (id, data) => {
    try {
      if (currentUser?.role === 'admin') {
        await updateServiceBookingAdmin({
          bookingId: id,
          status: data.status,
          paymentStatus: data.paymentStatus,
          paymentReviewNote: data.paymentReviewNote,
          actorUid: currentUser?.uid || '',
          actorName: currentUser?.name || '',
        })
      } else {
        await updateServiceBooking(id, data)
      }

      toast.success('طھظ… طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط­ط¬ط²')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleAddServiceMessage = async (data) => {
    try {
      const booking = state.serviceBookings.find((item) => item.id === data.bookingId)
      const customerAuthUid = data.customerAuthUid || booking?.customerAuthUid || null

      await addServiceMessage({
        ...data,
        customerAuthUid,
      })

      await addNotification({
        type: 'new_message',
        audience: data.sender === 'admin' ? 'customer' : 'admin',
        bookingId: data.bookingId,
        customerAuthUid,
        title: data.sender === 'admin' ? 'رسالة جديدة من الإدارة' : 'رسالة جديدة من العميل',
        body: data.text?.slice(0, 120) || '',
        read: false,
      })
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleMarkNotificationAsRead = async (id) => markNotificationAsRead(id)

  const handleAdjustCustomerWallet = async (payload) => {
    try {
      const result = await adjustCustomerWallet(payload)
      toast.success('تم تحديث محفظة العميل')
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleReviewCustomerAccount = async (uid, action, reason = '') => {
    try {
      await reviewCustomerAccount(uid, action, reason, {
        uid: currentUser?.uid || '',
        name: currentUser?.name || '',
      })
      const successMessage =
        action === 'approve'
          ? 'تم تفعيل حساب العميل'
          : action === 'reject'
            ? 'تم رفض الحساب'
            : 'تم إيقاف الحساب'
      toast.success(successMessage)
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const cartAdd = (item) => dispatch({ type: 'CART_ADD', item })
  const cartQty = (id, qty) => dispatch({ type: 'CART_QTY', id, qty })
  const cartRemove = (id) => dispatch({ type: 'CART_REMOVE', id })
  const cartClear = () => dispatch({ type: 'CART_CLEAR' })
  const cartTotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const cartCount = state.cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <StoreContext.Provider value={{
      ...state,
      cartTotal,
      cartCount,
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
      stockIn,
      stockOut,
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
      recordSupplierReturn: handleRecordSupplierReturn,
      addServiceBooking: handleAddServiceBooking,
      updateServiceBooking: handleUpdateServiceBooking,
      addServiceMessage: handleAddServiceMessage,
      markNotificationAsRead: handleMarkNotificationAsRead,
      adjustCustomerWallet: handleAdjustCustomerWallet,
      reviewCustomerAccount: handleReviewCustomerAccount,
      cartAdd,
      cartQty,
      cartRemove,
      cartClear,
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

