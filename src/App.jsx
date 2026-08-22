import { Suspense, lazy, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { StoreProvider, useStore } from './context/StoreContext'
import LoadingScreen from './components/LoadingScreen'
import IntroScreen from './components/IntroScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './context/AuthContext'

const Layout = lazy(() => import('./components/layout/Layout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Customers = lazy(() => import('./pages/Customers'))
const POS = lazy(() => import('./pages/POS'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Ledger = lazy(() => import('./pages/Ledger'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Reports = lazy(() => import('./pages/Reports'))
const Receipt = lazy(() => import('./pages/Receipt'))
const Quotes = lazy(() => import('./pages/Quotes'))
const QuotePrint = lazy(() => import('./pages/QuotePrint'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Purchases = lazy(() => import('./pages/Purchases'))
const StockHistory = lazy(() => import('./pages/StockHistory'))
const ServiceBookingsAdmin = lazy(() => import('./pages/ServiceBookingsAdmin'))
const Login = lazy(() => import('./pages/Login'))
const SupplierReturns = lazy(() => import('./pages/SupplierReturns'))
const SalesReturns = lazy(() => import('./pages/SalesReturns'))
const StaffActivity = lazy(() => import('./pages/StaffActivity'))
const ServiceCalendar = lazy(() => import('./pages/ServiceCalendar'))

function isStaffRole(role) {
  return role === 'admin' || role === 'cashier'
}

function AppRouter() {
  const { currentUser, loading: authLoading } = useAuth()
  const isAdminUser = currentUser?.role === 'admin'
  const isCashierUser = currentUser?.role === 'cashier'
  const isStaffUser = isStaffRole(currentUser?.role)

  if (authLoading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#10243b',
            color: '#f8fafc',
            border: '1px solid #2d5f93',
            boxShadow: '0 16px 40px rgba(16, 36, 59, 0.28)',
          },
        }}
      />
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route
          path="/login"
          element={
            currentUser && isStaffUser ? (
              <Navigate to={isAdminUser ? '/dashboard' : '/pos'} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route path="/admin-login" element={<Navigate to="/login" replace />} />
        <Route path="/customer-login" element={<Navigate to="/login" replace />} />
        <Route path="/customer/*" element={<Navigate to="/login" replace />} />
        <Route path="/portal/*" element={<Navigate to="/login" replace />} />
        <Route path="/service-booking" element={<Navigate to="/login" replace />} />

        {/* روابط الفواتير وعروض الأسعار للطباعة ومعاينة العميل */}
        <Route path="/receipt/:id" element={<Receipt />} />
        <Route path="/print-quote/:id" element={<QuotePrint />} />

        {/* توجيه المسار الرئيسي */}
        <Route
          path="/"
          element={
            isAdminUser ? (
              <Navigate to="/dashboard" replace />
            ) : isCashierUser ? (
              <Navigate to="/pos" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* لوحة تحكم الموظفين والمديرين */}
        {isStaffUser ? (
          <Route element={<Layout />}>
            <Route
              path="dashboard"
              element={isAdminUser ? <Dashboard /> : <Navigate to="/pos" replace />}
            />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />

            {isAdminUser && (
              <>
                <Route path="categories" element={<Categories />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="supplier-returns" element={<SupplierReturns />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="sales-returns" element={<SalesReturns />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="stock-history" element={<StockHistory />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="staff-activity" element={<StaffActivity />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="service-bookings" element={<ServiceBookingsAdmin />} />
                <Route path="service-calendar" element={<ServiceCalendar />} />
              </>
            )}

            <Route
              path="*"
              element={<Navigate to={isAdminUser ? '/dashboard' : '/pos'} replace />}
            />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    // 1. Skip intro completely on mobile for maximum performance and no lag
    const isMobile =
      window.innerWidth < 768 ||
      /Mobi|Android|iP(hone|ad|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) return false

    // 2. Skip intro on special routes (like printing a receipt)
    const path = window.location.pathname
    const isSpecialRoute =
      path.includes('/receipt/') || path.includes('/print-quote/')
    if (isSpecialRoute) return false

    // 3. Otherwise, play intro once per device/browser
    return !localStorage.getItem('elfarouk_intro_played')
  })

  if (showIntro) {
    return (
      <IntroScreen
        onFinished={() => {
          localStorage.setItem('elfarouk_intro_played', 'true')
          setShowIntro(false)
        }}
      />
    )
  }

  return (
    <AuthProvider>
      <StoreProvider>
        <StoreLoadingWrapper />
      </StoreProvider>
    </AuthProvider>
  )
}

function StoreLoadingWrapper() {
  const { loading: storeLoading } = useStore()

  if (storeLoading) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <AppRouter />
      </Suspense>
    </ErrorBoundary>
  )
}
