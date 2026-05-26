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
      toast.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ‚ط·ط¹ط©')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateProduct = async (id, data) => {
    try {
      await updateProduct(id, data)
      toast.success('طھظ… طھط­ط¯ظٹط« ط§ظ„ظ‚ط·ط¹ط©')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ظ‚ط·ط¹ط©')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddCategory = async (data) => {
    try {
      await addCategory(data)
      toast.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظپط¦ط©')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ظپط¦ط©')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddSupplier = async (data) => {
    try {
      await addSupplier(data)
      toast.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ…ظˆط±ط¯')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateSupplier = async (id, data) => {
    try {
      await updateSupplier(id, data)
      toast.success('طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ظˆط±ط¯')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ظ…ظˆط±ط¯')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddCustomer = async (data) => {
    try {
      await addCustomer(data)
      toast.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ…ظٹظ„')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateCustomer = async (id, data) => {
    try {
      await updateCustomer(id, data)
      toast.success('طھظ… طھط­ط¯ظٹط« ط§ظ„ط¹ظ…ظٹظ„')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteCustomer = async (id) => {
    try {
      await deleteCustomer(id)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ط¹ظ…ظٹظ„')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddExpense = async (data) => {
    try {
      await addExpense(data)
      toast.success('طھظ… طھط³ط¬ظٹظ„ ط§ظ„ظ…طµط±ظˆظپ ط¨ظ†ط¬ط§ط­')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ظ…طµط±ظˆظپ')
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
        details: `ط§ط³طھظ„ط§ظ… ${qty} ظ‚ط·ط¹ط©${note ? ` - ${note}` : ''}`,
        amount: qty,
      })
      toast.success(`طھظ…طھ ط¥ط¶ط§ظپط© ${qty} ظ‚ط·ط¹ط©`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const stockOut = async (productId, qty, reason = '') => {
    const product = state.products.find((item) => item.id === productId)
    if (!product || product.quantity < qty) {
      toast.error('ط§ظ„ظƒظ…ظٹط© ط؛ظٹط± ظ…طھظˆظپط±ط©')
      return
    }

    try {
      await updateProductStock(productId, -qty, 'stock_out', reason)
      await addTransaction({
        type: 'stockOut',
        refId: productId,
        details: `طµط±ظپ ${qty} ظ‚ط·ط¹ط©${reason ? ` - ${reason}` : ''}`,
        amount: qty,
      })
      toast.success(`طھظ… طµط±ظپ ${qty} ظ‚ط·ط¹ط©`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCompleteSale = async (params) => {
    try {
      const id = await completeSale(params)
      dispatch({ type: 'CART_CLEAR' })
      toast.success('طھظ… ط¥طھظ…ط§ظ… ط§ظ„ط¨ظٹط¹ ط¨ظ†ط¬ط§ط­')
      return id
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handlePayInvoiceDebt = async (invoiceId, amount, note) => {
    try {
      await payInvoiceDebt(invoiceId, amount, note)
      toast.success('طھظ… طھط³ط¬ظٹظ„ ط³ط¯ط§ط¯ ط§ظ„ظ…ط¯ظٹظˆظ†ظٹط© ط¨ظ†ط¬ط§ط­')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoiceAndReturnStock(invoiceId)
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ظپط§طھظˆط±ط© ظˆط§ط³طھط±ط¯ط§ط¯ ط§ظ„ظ…ط®ط²ظˆظ† ط¨ظ†ط¬ط§ط­')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleReturnItems = async (params) => {
    try {
      await returnInvoiceItems(params)
      toast.success('طھظ… ط¥ط±ط¬ط§ط¹ ط§ظ„ظ‚ط·ط¹ ظˆطھط³ظˆظٹط© ط§ظ„ظ…ط¨ط§ظ„ط؛ ط¨ظ†ط¬ط§ط­')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleSaveQuote = async (data) => {
    try {
      const id = await addQuote(data)
      toast.success('طھظ… ط­ظپط¸ ط¹ط±ط¶ ط§ظ„ط³ط¹ط± ط¨ظ†ط¬ط§ط­')
      return id
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteQuote = async (id) => {
    try {
      await deleteQuote(id)
      toast.success('طھظ… ظ…ط³ط­ ط¹ط±ط¶ ط§ظ„ط³ط¹ط±')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleImportProductsBatch = async (products) => {
    try {
      const result = await importProductsBatch(products)
      toast.success(`طھظ… ط¨ظ†ط¬ط§ط­! ط¥ط¶ط§ظپط©: ${result.addedCount} | طھط­ط¯ظٹط«: ${result.updatedCount}`)
      return result
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleRecordPurchase = async (data) => {
    try {
      await recordPurchase(data)
      toast.success('طھظ… طھط³ط¬ظٹظ„ ظپط§طھظˆط±ط© ط§ظ„ط´ط±ط§ط، ظˆطھط­ط¯ظٹط« ط§ظ„ظ…ط®ط²ظˆظ†')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handlePaySupplierDebt = async (supplierId, amount, note) => {
    try {
      await paySupplierDebt(supplierId, amount, note)
      toast.success('طھظ… طھط³ط¬ظٹظ„ ط³ط¯ط§ط¯ ط§ظ„ظ…ظˆط±ط¯ ط¨ظ†ط¬ط§ط­')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleAddServiceBooking = async (data) => {
    try {
      const result = await createServiceBooking(data)
      if (!result.alreadyExists) {
        toast.success('طھظ… طھط³ط¬ظٹظ„ ط§ظ„ط­ط¬ط² ط¨ظ†ط¬ط§ط­')
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
        title: data.sender === 'admin' ? 'ط±ط³ط§ظ„ط© ط¬ط¯ظٹط¯ط© ظ…ظ† ط§ظ„ط¥ط¯ط§ط±ط©' : 'ط±ط³ط§ظ„ط© ط¬ط¯ظٹط¯ط© ظ…ظ† ط§ظ„ط¹ظ…ظٹظ„',
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
      toast.success('طھظ… طھط­ط¯ظٹط« ظ…ط­ظپط¸ط© ط§ظ„ط¹ظ…ظٹظ„')
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

