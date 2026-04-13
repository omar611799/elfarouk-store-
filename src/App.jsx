import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { StoreProvider } from './context/StoreContext'
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
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'

// Auth
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'

function AppRouter() {
  const { currentUser, loading: authLoading } = useAuth()
  
  if (authLoading) return <LoadingScreen />
  if (!currentUser) return <Login />

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
        }}
      />
      <Routes>
        <Route path="/receipt/:id" element={<Receipt />} />
        <Route path="/print-quote/:id" element={<QuotePrint />} />
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
              <Route path="ledger"       element={<Ledger />} />
              <Route path="expenses"     element={<Expenses />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports"      element={<Reports />} />
            </>
          ) : (
            // Cashier fallback index
            <Route index element={<Navigate to="/pos" />} />
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  const [splashLoading, setSplashLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSplashLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AuthProvider>
      <StoreProvider>
        <AnimatePresence>
          {splashLoading && <LoadingScreen />}
        </AnimatePresence>
        
        {!splashLoading && (
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        )}
      </StoreProvider>
    </AuthProvider>
  )
}
