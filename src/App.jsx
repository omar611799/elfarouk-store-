import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import POS from './pages/POS'
import Invoices from './pages/Invoices'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products"     element={<Products />} />
            <Route path="categories"   element={<Categories />} />
            <Route path="suppliers"    element={<Suppliers />} />
            <Route path="customers"    element={<Customers />} />
            <Route path="pos"          element={<POS />} />
            <Route path="invoices"     element={<Invoices />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="*"            element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
