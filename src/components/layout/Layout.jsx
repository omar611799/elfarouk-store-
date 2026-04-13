import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Tag, Truck, Users,
  ShoppingCart, FileText, ArrowLeftRight, Menu, X, Store, BarChart3, BookOpen, TrendingDown, ClipboardList, Bell, ShoppingBag
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { LogOut, ShieldCheck, User as UserIcon } from 'lucide-react'

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'الرئيسية',     adminOnly: true },
  { to: '/products',    icon: Package,         label: 'قطع الغيار',   adminOnly: false },
  { to: '/categories',  icon: Tag,             label: 'الفئات',       adminOnly: true },
  { to: '/suppliers',   icon: Truck,           label: 'الموردين',     adminOnly: true },
  { to: '/purchases',   icon: ShoppingBag,     label: 'المشتريات',    adminOnly: true },
  { to: '/customers',   icon: Users,           label: 'العملاء',      adminOnly: false },
  { to: '/pos',         icon: ShoppingCart,    label: 'نقطة البيع',   adminOnly: false },
  { to: '/invoices',    icon: FileText,        label: 'الفواتير',     adminOnly: true },
  { to: '/quotes',      icon: ClipboardList,   label: 'عروض أسعار',    adminOnly: true },
  { to: '/stock-history', icon: ArrowLeftRight,  label: 'سجل المخزن',   adminOnly: true },
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
    <div className="flex h-screen overflow-hidden bg-obsidian-950 text-slate-200 relative">
      {/* Dynamic Background Ornament */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electric-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-72 bg-obsidian-950 border-l border-white/5 z-50
        transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${open ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col shadow-2xl
      `}>
        {/* Logo */}
        <div className="flex items-center gap-4 p-8 border-b border-white/5 bg-obsidian-950/50 backdrop-blur-md">
          <div className="w-12 h-12 bg-gradient-to-br from-electric-600 to-electric-400 rounded-2xl flex items-center justify-center shadow-neon rotate-3 hover:rotate-0 transition-transform duration-300">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-lg tracking-tight font-display">الفاروق ستور</p>
            <p className="text-[10px] text-electric-400 font-black uppercase tracking-widest opacity-80">Elite ERP</p>
          </div>
          <button onClick={() => setOpen(false)} className="mr-auto lg:hidden text-slate-500 hover:text-white transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-none custom-scrollbar">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300 relative overflow-hidden group
                ${isActive
                  ? 'text-white bg-white/[0.03] shadow-inner ring-1 ring-white/10'
                  : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-glow"
                      className="absolute inset-0 bg-gradient-to-r from-electric-500/10 to-transparent pointer-events-none"
                    />
                  )}
                  <Icon size={20} className={`transition-all duration-500 ${isActive ? 'text-electric-400 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'group-hover:text-slate-300'}`} />
                  <span className="relative z-10 tracking-wide">{label}</span>
                  {to === '/pos' && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="mr-auto bg-electric-500 text-white text-[10px] w-5 h-5 rounded-lg flex items-center justify-center font-black shadow-neon"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-6 border-t border-white/5 bg-obsidian-950/20 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-6 p-1">
            <div className="w-11 h-11 bg-obsidian-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group hover:border-electric-500/30 transition-colors">
              {currentUser?.role === 'admin' ? <ShieldCheck size={22} className="text-amber-400" /> : <UserIcon size={22} className="text-electric-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate font-display">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-70">{currentUser?.role === 'admin' ? 'مدير النظام' : 'بائع / كاشير'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-all text-xs font-black uppercase tracking-widest border border-rose-500/10"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar (Mobile only) */}
        <header className="bg-obsidian-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center gap-4 lg:hidden z-20 relative shadow-2xl">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-xl">
            <Menu size={24} />
          </button>
          <span className="font-black text-white text-xl font-display">الفاروق ستور</span>
          {cartCount > 0 && (
            <NavLink to="/pos" className="mr-auto bg-electric-600 text-white text-[10px] px-5 py-2 rounded-xl font-black shadow-neon uppercase tracking-widest">
              السلة ({cartCount})
            </NavLink>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 z-10 relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
