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
  const { cartCount } = useStore()
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
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-[#f97316] rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 shrink-0">
            <Store size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white leading-tight truncate">AutoPartsPro</h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">System v3.0</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden mr-auto p-2 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${isActive 
                  ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/20' 
                  : 'hover:bg-white/5 hover:text-white text-slate-400'}`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
              {to === '/pos' && cartCount > 0 && (
                <span className="mr-auto bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white shrink-0">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate text-right">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase text-right leading-none mt-1">{currentUser?.role === 'admin' ? 'مدير' : 'كاشير'}</p>
                </div>
             </div>
             <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all text-xs font-bold"
             >
                <LogOut size={16} /> تسجيل الخروج
             </button>
          </div>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-right">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl">
              <Menu size={24} className="text-slate-600" />
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="بحث مجمع..." className="bg-transparent border-none outline-none text-sm w-64 text-slate-800 placeholder-slate-400 text-right" />
            </div>
            <h1 className="lg:hidden text-lg font-black text-slate-800 font-display">{activePage?.label}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 flex-row-reverse">
            <div className="hidden sm:flex items-center gap-4 flex-row-reverse">
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <Bell size={20} />
               </button>
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <Settings size={20} />
               </button>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3 flex-row-reverse">
               <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 text-left">{currentUser?.name}</p>
                  <p className="text-[10px] text-[#f97316] font-bold text-left uppercase">النسخة الاحترافية</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                  <UserIcon size={20} />
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#f8fafc]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

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
