import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Tag, Truck, Users,
  ShoppingCart, FileText, ArrowLeftRight, Menu, X, Store, BarChart3, BookOpen, TrendingDown, ClipboardList, Bell
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { LogOut, ShieldCheck, User as UserIcon } from 'lucide-react'

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'الرئيسية',     adminOnly: true },
  { to: '/products',    icon: Package,         label: 'قطع الغيار',   adminOnly: false },
  { to: '/categories',  icon: Tag,             label: 'الفئات',       adminOnly: true },
  { to: '/suppliers',   icon: Truck,           label: 'الموردين',     adminOnly: true },
  { to: '/customers',   icon: Users,           label: 'العملاء',      adminOnly: false },
  { to: '/pos',         icon: ShoppingCart,    label: 'نقطة البيع',   adminOnly: false },
  { to: '/invoices',    icon: FileText,        label: 'الفواتير',     adminOnly: true },
  { to: '/quotes',      icon: ClipboardList,   label: 'عروض أسعار',    adminOnly: true },
  { to: '/ledger',      icon: BookOpen,        label: 'المديونيات',   adminOnly: true },
  { to: '/expenses',    icon: TrendingDown,    label: 'المصروفات',    adminOnly: true },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'المعاملات',    adminOnly: true },
  { to: '/reports',     icon: BarChart3,       label: 'التقارير',     adminOnly: true },
  { to: '/reminders',   icon: Bell,            label: 'المنبهات',     adminOnly: true },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { cartCount } = useStore()
  const { currentUser, logout } = useAuth()
  const location = useLocation()

  const allowedNav = nav.filter(n => currentUser?.role === 'admin' || !n.adminOnly)

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-200 selection:bg-primary-500/30">
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-64 glass border-l border-white/10 z-50
        transform transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base tracking-wide">الفاروق ستور</p>
            <p className="text-xs text-primary-400 font-medium">نظام الإدارة الحديث</p>
          </div>
          <button onClick={() => setOpen(false)} className="mr-auto lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group
                ${isActive
                  ? 'text-white glass bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-l-full shadow-glow"
                    />
                  )}
                  <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-primary-400' : 'group-hover:text-slate-300'}`} />
                  <span className="relative z-10">{label}</span>
                  {to === '/pos' && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mr-auto bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-glow font-bold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                  
                  {isActive && (
                     <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
              {currentUser?.role === 'admin' ? <ShieldCheck size={20} className="text-amber-400" /> : <UserIcon size={20} className="text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{currentUser?.role === 'admin' ? 'مدير النظام' : 'بائع / كاشير'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-colors text-sm font-bold"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background effects for depth */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top bar (Mobile only) */}
        <header className="glass border-b border-white/5 px-5 py-4 flex items-center gap-3 lg:hidden z-20 relative shadow-md">
          <button onClick={() => setOpen(true)} className="text-slate-300 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <span className="font-bold text-white text-lg">الفاروق ستور</span>
          {cartCount > 0 && (
            <NavLink to="/pos" className="mr-auto bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-glow">
              السلة ({cartCount})
            </NavLink>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
