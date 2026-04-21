import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Tag, Truck, Users,
  ShoppingCart, FileText, ArrowLeftRight, Menu, X, BarChart3, BookOpen, ClipboardList, Bell, ShoppingBag,
  Search, Settings, User as UserIcon, LogOut
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'لوحة التحكم',   adminOnly: true },
  { to: '/pos',         icon: ShoppingCart,    label: 'نقطة البيع',     adminOnly: false },
  { to: '/products',    icon: Package,         label: 'المخزن',         adminOnly: false },
  { to: '/categories',  icon: Tag,             label: 'الفئات',         adminOnly: true },
  { to: '/suppliers',   icon: Truck,           label: 'الموردين',       adminOnly: true },
  { to: '/purchases',   icon: ShoppingBag,     label: 'المشتريات',      adminOnly: true },
  { to: '/customers',   icon: Users,           label: 'العملاء',        adminOnly: false },
  { to: '/invoices',    icon: FileText,        label: 'الفواتير',       adminOnly: true },
  { to: '/quotes',      icon: ClipboardList,   label: 'عروض أسعار',      adminOnly: true },
  { to: '/ledger',      icon: BookOpen,        label: 'المديونيات',     adminOnly: true },
  { to: '/reminders',   icon: Bell,            label: 'المنبهات',       adminOnly: true },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'المعاملات',      adminOnly: true },
  { to: '/reports',     icon: BarChart3,       label: 'التقارير',       adminOnly: true },
]

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { cartCount, products } = useStore()
  const { currentUser, logout } = useAuth()
  const location = useLocation()

  const activePage = nav.find(n => n.to === location.pathname) || nav[0]
  const isPosRoute = location.pathname.startsWith('/pos')
  const allowedNav = nav.filter(item => !item.adminOnly || currentUser?.role === 'admin')
  const roleLabel = currentUser?.role === 'admin' ? 'مدير النظام' : 'كاشير'
  const mobileNavTargets = currentUser?.role === 'admin'
    ? ['/', '/pos', '/products', '/invoices']
    : ['/pos', '/products', '/customers']
  const mobileNav = allowedNav.filter(({ to }) => mobileNavTargets.includes(to))

  return (
    <div className="flex min-h-screen flex-row-reverse overflow-hidden bg-transparent font-display lg:h-screen" dir="rtl">
      <aside className={`
        fixed inset-y-0 right-0 z-50 flex w-[20rem] max-w-[88vw] flex-col overflow-hidden
        border-l border-white/10 bg-[linear-gradient(180deg,#08111c_0%,#10243b_45%,#0f1c2d_100%)]
        text-slate-200 shadow-[0_25px_80px_rgba(8,17,28,0.28)] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(143,180,216,0.28),transparent_58%)]" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />
        </div>

        <div className="relative flex items-start gap-4 border-b border-white/10 p-5 sm:p-7">
          <div className="shrink-0 overflow-hidden rounded-[1.4rem] bg-white/95 p-2 shadow-[0_18px_44px_rgba(8,17,28,0.22)]">
            <img
              src="/brand-logo.png"
              alt="ELFAROUK Service"
              className="h-16 w-16 rounded-xl object-contain sm:h-20 sm:w-20"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary-200/90">ELFAROUK SERVICE</p>
            <h2 className="mt-2 text-2xl font-black leading-none tracking-tight text-white">مركز التشغيل</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              إدارة المخزن والمبيعات بأسلوب أوضح ومتناسق مع هوية اللوجو.
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="mr-auto rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-3 text-center backdrop-blur-md">
              <p className="text-xl font-black text-white">{products?.length || 0}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">منتجات</p>
            </div>
            <div className="rounded-[1.35rem] border border-primary-400/20 bg-primary-500/10 p-3 text-center backdrop-blur-md">
              <p className="text-xl font-black text-white">{cartCount}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary-200">في السلة</p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 pb-6 custom-scrollbar">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                group relative flex items-center gap-4 overflow-hidden rounded-[1.35rem] px-4 py-3.5 text-sm font-bold
                transition-all duration-300
                ${isActive
                  ? 'bg-[linear-gradient(135deg,#163d65_0%,#225c97_100%)] text-white shadow-[0_16px_35px_rgba(34,92,151,0.32)]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'}
              `}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform group-hover:scale-105">
                <Icon size={18} />
              </div>
              <span className="relative z-10">{label}</span>
              {to === '/pos' && cartCount > 0 && (
                <span className="mr-auto rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
             <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] text-white shadow-[0_12px_30px_rgba(34,92,151,0.22)]">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white truncate text-right">{currentUser?.name}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary-200 text-right leading-none">{roleLabel}</p>
                </div>
             </div>
             <button
               onClick={logout}
               className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-black text-white transition-all hover:bg-primary-500"
             >
                <LogOut size={16} /> خروج من الحساب
             </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-right">
        <header className={`sticky top-0 z-30 h-20 shrink-0 items-center justify-between border-b border-primary-100/80 bg-white/[0.85] px-4 backdrop-blur-xl sm:h-24 sm:px-7 ${isPosRoute ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-2xl border border-primary-100 bg-white p-3 text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-colors hover:bg-primary-50 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={24} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3 lg:hidden">
              <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-[0_10px_28px_rgba(34,92,151,0.14)] ring-1 ring-primary-100">
                <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-10 w-10 object-contain sm:h-11 sm:w-11" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary-600">ELFAROUK</p>
                <h1 className="truncate text-base font-black text-slate-900 sm:text-xl">{activePage?.label}</h1>
              </div>
            </div>
            <div className="group hidden xl:flex items-center gap-3 rounded-[1.35rem] border border-primary-100 bg-slate-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all focus-within:border-primary-300 focus-within:bg-white focus-within:shadow-[0_16px_35px_rgba(34,92,151,0.08)]">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="بحث سريع عن منتج، عميل أو فاتورة..."
                className="min-w-[16rem] flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <span className="rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-black text-primary-600">SKU</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2">
               <button className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white text-slate-500 transition-all hover:bg-primary-50 hover:text-primary-600">
                  <Bell size={20} />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-500 group-hover:animate-ping" />
               </button>
               <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white text-slate-500 transition-all hover:bg-primary-50 hover:text-primary-600">
                  <Settings size={20} />
               </button>
            </div>
            <div className="hidden items-center gap-3 rounded-[1.4rem] border border-primary-100 bg-primary-50/60 px-3 py-2 md:flex">
               <div className="text-left">
                  <p className="text-sm font-black leading-tight text-slate-900">{currentUser?.name}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">{roleLabel}</p>
               </div>
               <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] text-white shadow-[0_12px_28px_rgba(34,92,151,0.24)]">
                  <UserIcon size={20} />
               </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] text-white shadow-[0_12px_28px_rgba(34,92,151,0.24)] md:hidden">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        <main className={`custom-scrollbar flex-1 overflow-y-auto bg-transparent ${isPosRoute ? 'p-0' : 'p-4 pb-32 sm:p-6 sm:pb-8 lg:p-7'}`}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={isPosRoute ? 'min-h-full' : 'mx-auto max-w-[1400px]'}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {!isPosRoute && (
        <nav
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-primary-100/80 bg-white/[0.92] px-2 py-2 shadow-[0_-14px_40px_rgba(15,34,56,0.08)] backdrop-blur-2xl lg:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className={`mx-auto grid w-full max-w-lg gap-1.5 ${mobileNav.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {mobileNav.map(({ to, icon, label }) => (
              <BottomNavLink key={to} to={to} icon={icon} label={label === 'نقطة البيع' ? 'بيع' : label} active={location.pathname === to} />
            ))}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function BottomNavLink({ to, icon: Icon, label, active }) {
  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center gap-1.5 rounded-[1.4rem] px-2 py-2 text-center transition-all duration-300 ${
        active
          ? 'bg-primary-50 text-primary-700 shadow-[0_10px_24px_rgba(34,92,151,0.12)]'
          : 'text-slate-500'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={20} />
      </span>
      <span className="text-[11px] font-black leading-none">{label}</span>
    </NavLink>
  )
}
