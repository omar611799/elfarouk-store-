import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Truck, Users,
  ShoppingCart, FileText, ArrowLeftRight, Menu, X, Store
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/products',    icon: Package,         label: 'قطع الغيار' },
  { to: '/categories',  icon: Tag,             label: 'الفئات' },
  { to: '/suppliers',   icon: Truck,           label: 'الموردين' },
  { to: '/customers',   icon: Users,           label: 'العملاء' },
  { to: '/pos',         icon: ShoppingCart,    label: 'نقطة البيع' },
  { to: '/invoices',    icon: FileText,        label: 'الفواتير' },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'المعاملات' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { cartCount } = useStore()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-30
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">الفاروق ستور</p>
            <p className="text-xs text-slate-400">نظام الإدارة</p>
          </div>
          <button onClick={() => setOpen(false)} className="mr-auto lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
                  <span>{label}</span>
                  {to === '/pos' && cartCount > 0 && (
                    <span className="mr-auto bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-bold text-white">الفاروق ستور</span>
          {cartCount > 0 && (
            <NavLink to="/pos" className="mr-auto bg-primary-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              السلة ({cartCount})
            </NavLink>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
