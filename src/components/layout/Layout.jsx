import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Tag, Truck, Users,
  ShoppingCart, FileText, ArrowLeftRight, Menu, X, Store, BarChart3, BookOpen, TrendingDown, ClipboardList, Bell, ShoppingBag,
  Search, Settings, HelpCircle, User as UserIcon, LogOut, ShieldCheck
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

  const allowedNav = nav.filter(item => 
    !item.adminOnly || currentUser?.role === 'admin'
  )

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-display flex-row-reverse" dir="rtl">
      
      {/* --- Sidebar (Enterprise Style) --- */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-slate-300 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col shadow-xl
      `}>
        {/* Sidebar Header */}
        <div className="p-8 flex items-center gap-4 border-b border-slate-800/50">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 transform rotate-3 shrink-0">
            <Store size={26} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white leading-tight tracking-tight">AutoPartsPro</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Enterprise v3.1</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden mr-auto p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 custom-scrollbar">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                ${isActive 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                  : 'hover:bg-white/[0.03] hover:text-white text-slate-400'}`
              }
            >
              <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
              <span className="relative z-10">{label}</span>
              {to === '/pos' && cartCount > 0 && (
                <span className="mr-auto bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-full font-black backdrop-blur-sm">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Mini Stats */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 text-center">
            <p className="text-lg font-black text-white">{cartCount > 0 ? cartCount : products?.length || 0}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">منتجات المخزن</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 text-center">
            <p className="text-lg font-black text-white">{cartCount}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">سلة البيع</p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="bg-slate-800/30 rounded-2xl p-4 border border-white/5">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-tr from-slate-700 to-slate-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white truncate text-right">{currentUser?.name}</p>
                  <p className="text-[10px] text-primary-500 font-bold uppercase tracking-wider text-right leading-none mt-1">{currentUser?.role === 'admin' ? 'مدير النظام' : 'كاشير'}</p>
                </div>
             </div>
             <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-all text-xs font-black"
             >
                <LogOut size={16} /> تسجيل الخروج
             </button>
          </div>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-right">
        
        {/* Top Header */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between z-40 shrink-0 sticky top-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <Menu size={24} className="text-slate-600" />
            </button>
            <div className="hidden lg:flex items-center gap-3 bg-slate-50/50 px-5 py-3 rounded-2xl border border-slate-200/60 w-[400px] group transition-all focus-within:border-primary-500/50 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary-500/5 theme-transition">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" placeholder="بحث عن منتج، عميل أو رقم فاتورة..." className="bg-transparent border-none outline-none text-sm flex-1 text-slate-800 placeholder-slate-400 text-right font-semibold" />
              <span className="px-2 py-1 bg-slate-200/50 text-[10px] font-black text-slate-400 rounded-md">SKU</span>
            </div>
            <h1 className="lg:hidden text-xl font-black text-slate-800 font-display tracking-tight">{activePage?.label}</h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 flex-row-reverse">
            <div className="hidden sm:flex items-center gap-6 flex-row-reverse">
               <button className="relative w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-2xl transition-all group">
                  <Bell size={22} />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary-500 border-2 border-white rounded-full group-hover:animate-ping" />
               </button>
               <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
                  <Settings size={22} />
               </button>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-4 flex-row-reverse cursor-pointer hover:bg-slate-50 p-2 pr-4 rounded-2xl transition-colors">
               <div className="text-left hidden sm:block">
                  <p className="text-sm font-black text-slate-900 text-left leading-tight">{currentUser?.name}</p>
                  <p className="text-[11px] text-primary-500 font-black text-left uppercase tracking-tight mt-0.5">مدير المنظومة</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-slate-500 overflow-hidden shrink-0 shadow-md">
                  <UserIcon size={24} />
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-5 pb-32 sm:p-7 sm:pb-7 custom-scrollbar bg-[#f4f6fa]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200 z-[60] flex items-center justify-around px-2 py-2 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <BottomNavLink to="/" icon={LayoutDashboard} label="الرئيسية" active={location.pathname === '/'} />
        <BottomNavLink to="/pos" icon={ShoppingCart} label="بيع" active={location.pathname === '/pos'} />
        <BottomNavLink to="/products" icon={Package} label="المخزن" active={location.pathname === '/products'} />
        <BottomNavLink to="/invoices" icon={FileText} label="الفواتير" active={location.pathname === '/invoices'} />
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
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
      className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${active ? 'text-primary-600 bg-primary-50 scale-110 shadow-sm' : 'text-slate-500 opacity-80'}`}
    >
      <Icon size={22} className={active ? 'animate-pulse' : ''} />
      <span className="text-xs font-black">{label}</span>
    </NavLink>
  )
}
