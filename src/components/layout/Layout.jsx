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
  const activePageLabel = nav.find(n => n.to === location.pathname || (n.to === '/' && location.pathname === '/'))?.label || 'الفاروق ستور'
  
  const allowedNav = nav.filter(item => 
    !item.adminOnly || currentUser?.role === 'admin'
  )

  const bottomNavItems = [
    { to: currentUser?.role === 'admin' ? '/' : '/pos', icon: LayoutDashboard, label: 'الرئيسية' },
    { to: '/pos', icon: ShoppingCart, label: 'البيع' },
    { to: '/products', icon: Package, label: 'المخزن' },
    { to: '/customers', icon: Users, label: 'العملاء' },
  ]

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 relative z-0 pb-safe">
      {/* Video Background */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-slate-950">
        <video 
          autoPlay muted loop playsInline
          poster="/background.jpg"
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        >
          <source src="/dashboard-bg.mp4" type="video/mp4" />
        </video>
        {/* Professional Backdrop Overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-72 bg-obsidian-950/95 backdrop-blur-3xl border-l border-white/5 z-[70]
        transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${open ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col shadow-2xl
      `}>
        {/* Logo Section */}
        <div className="flex items-center gap-4 p-8 border-b border-white/5 bg-black/20">
          <div className="w-12 h-12 bg-gradient-to-br from-electric-600 to-electric-400 rounded-2xl flex items-center justify-center shadow-neon rotate-3">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-lg tracking-tight font-display">الفاروق ستور</p>
            <p className="text-[10px] text-electric-400 font-black uppercase tracking-widest opacity-80 leading-none">Elite ERP</p>
          </div>
          <button onClick={() => setOpen(false)} className="mr-auto lg:hidden text-slate-500 hover:text-white transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-6 overflow-y-auto space-y-2 custom-scrollbar pb-40 lg:pb-6">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300 relative overflow-hidden group
                ${isActive
                  ? 'text-white bg-white/[0.04] shadow-inner ring-1 ring-white/10'
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
                  <Icon size={20} className={`transition-all duration-500 ${isActive ? 'text-electric-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-slate-300'}`} />
                  <span className="relative z-10 tracking-wide font-display">{label}</span>
                  {to === '/pos' && cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="mr-auto bg-electric-500 text-white text-[9px] w-5 h-5 rounded-lg flex items-center justify-center font-black shadow-neon"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Profile Section */}
        <div className="p-6 border-t border-white/5 bg-black/20 hidden lg:block">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 bg-obsidian-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
              {currentUser?.role === 'admin' ? <ShieldCheck size={22} className="text-amber-400" /> : <UserIcon size={22} className="text-electric-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate font-display">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-70">
                {currentUser?.role === 'admin' ? 'مدير النظام' : 'كاشير / بائع'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition-all text-[10px] font-black uppercase tracking-widest border border-rose-500/10"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Desktop Header / Mobile Compact Header */}
        <header className="bg-obsidian-950/40 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden text-slate-400 hover:text-white transition-colors p-2.5 bg-white/5 rounded-xl active:scale-95">
              <Menu size={22} />
            </button>
            <div className="hidden lg:flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-electric-500/10 border border-white/5 flex items-center justify-center shadow-neon">
                 <Store size={16} className="text-electric-400" />
               </div>
               <span className="font-black text-white text-xs tracking-widest uppercase opacity-40 font-display">Farouk ERP System</span>
            </div>
            <h1 className="lg:hidden font-black text-white text-lg font-display tracking-tight">{activePageLabel}</h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Search or Quick Status could go here */}
             <div className="sm:flex items-center gap-3 hidden border-r border-white/10 pr-4">
                <div className="text-right">
                   <p className="text-xs text-white font-black leading-none mb-1 font-display">{currentUser?.name}</p>
                   <p className="text-[9px] text-electric-400 font-bold uppercase tracking-widest opacity-60">
                     {currentUser?.role === 'admin' ? 'المدير' : 'الكاشير'}
                   </p>
                </div>
                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                   <UserIcon size={16} className="text-slate-500" />
                </div>
             </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 z-10 relative scrollbar-hide pb-32 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- Mobile Only Navigation Shell --- */}
        <div className="lg:hidden block">
          {/* Floating Action Button (FAB) - Centered & Premium */}
          <div className="fixed bottom-24 inset-x-0 flex justify-center z-[55] pointer-events-none">
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="pointer-events-auto"
            >
              <NavLink 
                to="/pos" 
                className="w-16 h-16 bg-electric-600 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.6)] border-4 border-obsidian-950 active:bg-electric-500 transition-colors"
              >
                <ShoppingCart size={24} />
              </NavLink>
            </motion.div>
          </div>

          {/* Bottom Tab Bar */}
          <nav className="fixed bottom-0 inset-x-0 h-20 bg-obsidian-950/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
            {bottomNavItems.map(({ to, icon: Icon, label }) => {
              const isPOS = to === '/pos';
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => 
                    `flex flex-col items-center justify-center gap-1.5 transition-all relative
                    ${isPOS ? 'invisible' : ''} 
                    ${isActive ? 'text-electric-400' : 'text-slate-600'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-electric-500/10' : ''}`}>
                         <Icon size={22} className={isActive ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''} />
                      </div>
                      <span className={`text-[9px] font-black tracking-widest transition-all uppercase ${isActive ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
            
            {/* FAB Label Placeholder (Text only) */}
            <div className="flex flex-col items-center justify-center gap-1.5 absolute left-1/2 -translate-x-1/2 pt-10">
               <span className={`text-[9px] font-black tracking-widest uppercase opacity-40 ${location.pathname === '/pos' ? 'text-electric-400 opacity-100' : 'text-slate-600'}`}>بيع</span>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
