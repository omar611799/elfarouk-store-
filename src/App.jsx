import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { StoreProvider, useStore } from './context/StoreContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import POS from './pages/POS'
import Invoices from './pages/Invoices'
import Ledger from './pages/Ledger'
import Expenses from './pages/Expenses'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Receipt from './pages/Receipt'
import Quotes from './pages/Quotes'
import QuotePrint from './pages/QuotePrint'
import Reminders from './pages/Reminders'
import Purchases from './pages/Purchases'
import CustomerPortal from './pages/CustomerPortal'
import StockHistory from './pages/StockHistory'
import ServiceBooking from './pages/ServiceBooking'
import ServiceBookingsAdmin from './pages/ServiceBookingsAdmin'
import CustomerLogin from './pages/CustomerLogin'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'

// Auth
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'

function AppRouter() {
  const { currentUser, loading: authLoading } = useAuth()
  
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
        <Route path="/admin-login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/customer-login" element={<Navigate to="/customer/login" replace />} />
        <Route path="/service-booking" element={<Navigate to="/customer/booking" replace />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/booking" element={<ServiceBooking />} />
        <Route path="/receipt/:id" element={<Receipt />} />
        <Route path="/print-quote/:id" element={<QuotePrint />} />
        <Route path="/portal/:phone" element={<CustomerPortal />} />

        {!currentUser && <Route path="*" element={<Navigate to="/admin-login" replace />} />}
        {currentUser && (
        <Route path="/" element={<Layout />}>
          {/* Admin and Cashier have POS, Products, Customers */}
          <Route path="pos"          element={<POS />} />
          <Route path="products"     element={<Products />} />
          <Route path="customers"    element={<Customers />} />
          
          {/* Admin Only Paths */}
          {currentUser.role === 'admin' ? (
            <>
              <Route index element={<Dashboard />} />
              <Route path="categories"   element={<Categories />} />
              <Route path="suppliers"    element={<Suppliers />} />
              <Route path="invoices"     element={<Invoices />} />
              <Route path="quotes"       element={<Quotes />} />
              <Route path="stock-history" element={<StockHistory />} />
              <Route path="ledger"       element={<Ledger />} />
              <Route path="expenses"     element={<Expenses />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports"      element={<Reports />} />
              <Route path="reminders"    element={<Reminders />} />
              <Route path="purchases"    element={<Purchases />} />
              <Route path="service-bookings" element={<ServiceBookingsAdmin />} />
            </>
          ) : (
            // Cashier fallback index
            <Route index element={<Navigate to="/pos" />} />
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <StoreLoadingWrapper />
      </StoreProvider>
    </AuthProvider>
  )
}

function StoreLoadingWrapper() {
  const { loading: storeLoading } = useStore();
  const [animFinished, setAnimFinished] = useState(false);
  
  return (
    <>
      <AnimatePresence>
        {(storeLoading || !animFinished) && (
          <LoadingScreen onFinished={() => setAnimFinished(true)} />
        )}
      </AnimatePresence>
      
      {!storeLoading && animFinished && (
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      )}
    </>
  )
}
