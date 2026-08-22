import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  User as UserIcon,
  Users,
  Wrench,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', adminOnly: true },
  { to: '/pos', icon: ShoppingCart, label: 'نقطة البيع', adminOnly: false },
  { to: '/products', icon: Package, label: 'المخزن', adminOnly: false },
  { to: '/categories', icon: Tag, label: 'الفئات', adminOnly: true },
  { to: '/suppliers', icon: Truck, label: 'الموردين', adminOnly: true },
  { to: '/supplier-returns', icon: RotateCcw, label: 'مرتجعات الموردين', adminOnly: true },
  { to: '/purchases', icon: ShoppingBag, label: 'المشتريات', adminOnly: true },
  { to: '/customers', icon: Users, label: 'العملاء', adminOnly: false },
  { to: '/invoices', icon: FileText, label: 'الفواتير', adminOnly: true },
  { to: '/sales-returns', icon: RefreshCcw, label: 'مرتجعات المبيعات', adminOnly: true },
  { to: '/quotes', icon: ClipboardList, label: 'عروض أسعار', adminOnly: true },
  { to: '/ledger', icon: BookOpen, label: 'المديونيات', adminOnly: true },
  { to: '/reminders', icon: Bell, label: 'المنبهات', adminOnly: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'المعاملات', adminOnly: true },
  { to: '/reports', icon: BarChart3, label: 'التقارير', adminOnly: true },
  { to: '/staff-activity', icon: Activity, label: 'نشاط الموظفين', adminOnly: true },
  { to: '/service-bookings', icon: Wrench, label: 'حجوزات الصيانة', adminOnly: true },
  { to: '/service-calendar', icon: Calendar, label: 'تقويم الصيانة', adminOnly: true },
]

function matchesRoute(pathname, to) {
  if (to === '/dashboard') return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function getMobileNavLabel(to, label) {
  if (to === '/dashboard') return 'الرئيسية'
  if (to === '/pos') return 'بيع'
  return label
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifTab, setNotifTab] = useState('stock')
  const { cartCount, products = [], customers = [], invoices = [], notifications = [], markNotificationAsRead } = useStore()
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Command Palette
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsPaletteOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.quantity <= (p.minStock || 5))
  }, [products])

  const unreadDbNotifications = useMemo(() => {
    return notifications.filter(n => !n.read)
  }, [notifications])

  const totalNotifCount = lowStockProducts.length + unreadDbNotifications.length

  const activePage = nav.find((item) => matchesRoute(location.pathname, item.to)) || nav[0]
  const isPosRoute = location.pathname.startsWith('/pos')
  const allowedNav = nav.filter((item) => !item.adminOnly || currentUser?.role === 'admin')

  // Filtered results for command palette
  const paletteResults = useMemo(() => {
    if (!paletteSearch.trim()) return []
    const query = paletteSearch.toLowerCase()
    
    const matchedPages = allowedNav
      .filter(p => p.label.toLowerCase().includes(query))
      .map(p => ({ type: 'page', label: p.label, to: p.to, icon: p.icon }))

    const matchedProducts = products
      .filter(p => p.name.toLowerCase().includes(query) || String(p.sku || '').toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({ type: 'product', label: p.name, to: '/products', subtitle: `مخزون: ${p.quantity} | SKU: ${p.sku || '-'}` }))

    const matchedCustomers = customers
      .filter(c => c.name.toLowerCase().includes(query) || String(c.phone || '').includes(query))
      .slice(0, 5)
      .map(c => ({ type: 'customer', label: c.name, to: '/customers', subtitle: `هاتف: ${c.phone || '-'}` }))

    const matchedInvoices = invoices
      .filter(i => String(i.number).includes(query) || i.customerData?.name?.toLowerCase().includes(query))
      .slice(0, 5)
      .map(i => ({ type: 'invoice', label: `فاتورة #${i.number}`, to: '/invoices', subtitle: `عميل: ${i.customerData?.name || 'نقدي'} | إجمالي: ${i.total} ج.م` }))

    return [...matchedPages, ...matchedProducts, ...matchedCustomers, ...matchedInvoices]
  }, [paletteSearch, allowedNav, products, customers, invoices])
  const roleLabel = currentUser?.role === 'admin' ? 'مدير النظام' : 'كاشير'

  const mobileNavTargets =
    currentUser?.role === 'admin'
      ? ['/dashboard', '/pos', '/products']
      : ['/pos', '/products', '/customers']

  const mobileNav = allowedNav.filter(({ to }) => mobileNavTargets.includes(to))
  const isMobilePrimaryActive = mobileNav.some(({ to }) => matchesRoute(location.pathname, to))
  const isMoreActive = !isMobilePrimaryActive

  const posHeaderCountLabel = useMemo(() => {
    if (cartCount > 99) return '99+'
    return String(cartCount || 0)
  }, [cartCount])

  const handleOpenSidebar = () => setIsSidebarOpen(true)
  const handleCloseSidebar = () => setIsSidebarOpen(false)
  const handleLogout = async () => {
    setIsSidebarOpen(false)
    await logout()
  }

  const handleEditName = async () => {
    const newName = window.prompt('تعديل اسمك في النظام:', currentUser?.name || '')
    if (newName && newName.trim()) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore')
        const { db } = await import('../../firebase/config')
        await updateDoc(doc(db, 'users', currentUser.uid), { name: newName.trim() })
        window.location.reload()
      } catch (e) {
        alert('حدث خطأ أثناء حفظ الاسم')
      }
    }
  }

  return (
    <div
      className="flex min-h-screen flex-row-reverse overflow-hidden bg-transparent font-display lg:h-screen"
      dir="rtl"
    >
      <aside
        className={`
          fixed inset-y-0 right-0 z-[80] flex w-[19rem] max-w-[88vw] flex-col overflow-hidden
          border-l border-white/5 bg-[#0b0f19]
          text-slate-200 shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative flex items-start gap-4 border-b border-white/5 p-5 sm:p-7">

          <div className="shrink-0 overflow-hidden rounded-[1.4rem] bg-white/95 p-2 shadow-[0_18px_44px_rgba(8,17,28,0.22)]">
            <img
              src="/brand-logo.png"
              alt="ELFAROUK Service"
              className="h-16 w-16 rounded-xl object-contain sm:h-20 sm:w-20"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary-200/90">
              ELFAROUK SERVICE
            </p>
            <h2 className="mt-2 text-2xl font-black leading-none tracking-tight text-white">
              مركز التشغيل
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              إدارة المخزن والمبيعات بشكل أوضح وأسهل على الموبايل والديسكتوب.
            </p>
          </div>

          <button
            onClick={handleCloseSidebar}
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
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                منتجات
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-primary-400/20 bg-primary-500/10 p-3 text-center backdrop-blur-md">
              <p className="text-xl font-black text-white">{cartCount}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary-200">
                في السلة
              </p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 pb-6 custom-scrollbar">
          {allowedNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={handleCloseSidebar}
              className={({ isActive }) =>
                `
                group relative flex items-center gap-4 overflow-hidden rounded-[1.35rem] px-4 py-3.5 text-sm font-bold
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,#163d65_0%,#225c97_100%)] text-white shadow-[0_16px_35px_rgba(34,92,151,0.32)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }
              `
              }
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

        <div
          className="relative border-t border-white/10 p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] text-white shadow-[0_12px_30px_rgba(34,92,151,0.22)]">
                <UserIcon size={18} />
              </div>
              <div className="min-w-0 flex-1 cursor-pointer group/name" onClick={handleEditName} title="تعديل الاسم">
                <p className="truncate text-right text-sm font-black text-white group-hover/name:text-primary-300 transition-colors">
                  {currentUser?.name && !/[\uFFFD]/.test(currentUser.name) ? currentUser.name : 'مدير النظام'}
                </p>
                <p className="mt-1 text-right text-[10px] font-black uppercase leading-none tracking-[0.2em] text-primary-200">
                  {roleLabel}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-black text-white transition-all hover:bg-primary-500"
            >
              <LogOut size={16} />
              خروج من الحساب
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-right">
        {isPosRoute && (
          <header
            className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary-100/80 bg-white/[0.92] px-3 py-3 backdrop-blur-xl lg:hidden"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={handleOpenSidebar}
                className="rounded-2xl border border-primary-100 bg-white p-3 text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-colors hover:bg-primary-50"
                aria-label="فتح القائمة"
              >
                <Menu size={22} className="text-slate-600" />
              </button>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary-600">
                  ELFAROUK
                </p>
                <h1 className="truncate text-base font-black text-slate-900">
                  {activePage?.label}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-[1.1rem] border border-primary-100 bg-primary-50 px-3 py-2 text-primary-700 shadow-[0_10px_24px_rgba(34,92,151,0.08)]">
              <ShoppingCart size={16} />
              <span className="text-xs font-black">{posHeaderCountLabel}</span>
            </div>
          </header>
        )}

        <header
          className={`sticky top-0 z-30 h-20 shrink-0 items-center justify-between border-b border-primary-100/80 bg-white/[0.85] px-4 backdrop-blur-xl sm:h-24 sm:px-7 ${
            isPosRoute ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleOpenSidebar}
              className="rounded-2xl border border-primary-100 bg-white p-3 text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-colors hover:bg-primary-50 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={24} className="text-slate-600" />
            </button>

            <div className="flex items-center gap-3 lg:hidden">
              <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-[0_10px_28px_rgba(34,92,151,0.14)] ring-1 ring-primary-100">
                <img
                  src="/brand-logo.png"
                  alt="ELFAROUK Service"
                  className="h-10 w-10 object-contain sm:h-11 sm:w-11"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary-600">
                  ELFAROUK
                </p>
                <h1 className="truncate text-base font-black text-slate-900 sm:text-xl">
                  {activePage?.label}
                </h1>
              </div>
            </div>

            <div onClick={() => setIsPaletteOpen(true)} className="group hidden cursor-pointer items-center gap-3 rounded-[1.35rem] border border-primary-100 bg-slate-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all hover:border-primary-300 hover:bg-white xl:flex">
              <Search
                size={18}
                className="text-slate-400"
              />
              <span className="min-w-[16rem] flex-1 text-right text-sm font-semibold text-slate-400 select-none">
                بحث سريع عن منتج، عميل أو فاتورة... (Ctrl + K)
              </span>
              <span className="rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-black text-primary-600">
                Ctrl+K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Bell Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white text-slate-500 transition-all hover:bg-primary-50 hover:text-primary-600"
              >
                <Bell size={20} />
                {totalNotifCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
                    {totalNotifCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-3 z-50 w-80 sm:w-96 rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_rgba(8,17,28,0.15)]"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <h3 className="font-black text-slate-900 text-sm">الإشعارات</h3>
                        {totalNotifCount > 0 && (
                          <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full">
                            {totalNotifCount} جديدة
                          </span>
                        )}
                      </div>

                      {/* Tabs */}
                      <div className="flex border-b border-slate-100 pb-2 mb-2 text-xs font-bold text-slate-500">
                        <button
                          onClick={() => setNotifTab('stock')}
                          className={`flex-1 pb-1.5 text-center border-b-2 transition-all ${
                            notifTab === 'stock'
                              ? 'border-primary-500 text-primary-600 font-black'
                              : 'border-transparent hover:text-slate-800'
                          }`}
                        >
                          مخزون منخفض ({lowStockProducts.length})
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => setNotifTab('system')}
                            className={`flex-1 pb-1.5 text-center border-b-2 transition-all ${
                              notifTab === 'system'
                                ? 'border-primary-500 text-primary-600 font-black'
                                : 'border-transparent hover:text-slate-800'
                            }`}
                          >
                            النظام ({unreadDbNotifications.length})
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar text-right">
                        {notifTab === 'stock' ? (
                          lowStockProducts.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400 font-bold">جميع المنتجات متوفرة بمخزون كافٍ ✓</p>
                          ) : (
                            lowStockProducts.map(p => (
                              <div key={p.id} className="p-2.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Package size={16} className="text-amber-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-black text-slate-900 text-xs truncate">{p.name}</p>
                                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                                    الكمية الحالية: <span className="text-rose-500 font-black">{p.quantity}</span> (الحد الأدنى: {p.minStock || 5})
                                  </p>
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          unreadDbNotifications.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400 font-bold">لا توجد إشعارات نظام غير مقروءة</p>
                          ) : (
                            unreadDbNotifications.map(n => {
                              const date = n.createdAt?.toDate?.() || new Date(n.createdAt || 0)
                              return (
                                <div key={n.id} className="p-2.5 rounded-2xl bg-primary-500/[0.03] border border-primary-500/10 flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bell size={14} className="text-primary-500" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start">
                                      <p className="font-black text-slate-900 text-xs">{n.title}</p>
                                      <button
                                        onClick={() => markNotificationAsRead(n.id)}
                                        className="text-[9px] text-primary-500 font-black hover:underline shrink-0"
                                      >
                                        قراءة
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2">{n.body}</p>
                                    <p className="text-[8px] text-slate-400 font-bold mt-1">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                              )
                            })
                          )
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle Button */}
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white text-slate-500 transition-all hover:bg-primary-50 hover:text-primary-600"
                title={theme === 'dark' ? 'الوضع المضيء' : 'الوضع الداكن'}
              >
                {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-slate-600" />}
              </button>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white text-slate-500 transition-all hover:bg-primary-50 hover:text-primary-600">
                <Settings size={20} />
              </button>
            </div>

            <div className="hidden items-center gap-3 rounded-[1.4rem] border border-primary-100 bg-primary-50/60 px-3 py-2 md:flex">
              <div className="text-left cursor-pointer group/name" onClick={handleEditName} title="تعديل الاسم">
                <p className="text-sm font-black leading-tight text-slate-900 group-hover/name:text-primary-600 transition-colors">
                  {currentUser?.name && !/[\uFFFD]/.test(currentUser.name) ? currentUser.name : 'مدير النظام'}
                </p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                  {roleLabel}
                </p>
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

        <main
          className={`custom-scrollbar flex-1 bg-transparent ${
            isPosRoute ? 'p-0 overflow-hidden h-full' : 'p-4 pb-32 sm:p-6 sm:pb-8 lg:p-7 overflow-y-auto'
          }`}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={isPosRoute ? 'h-full min-h-full' : 'mx-auto max-w-[1400px]'}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {!isPosRoute && !isSidebarOpen && (
        <nav
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-primary-100/80 bg-white/[0.92] px-2 py-2 shadow-[0_-14px_40px_rgba(15,34,56,0.08)] backdrop-blur-2xl lg:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto grid w-full max-w-lg grid-cols-4 gap-1.5">
            {mobileNav.map(({ to, icon, label }) => (
              <BottomNavLink
                key={to}
                to={to}
                icon={icon}
                label={getMobileNavLabel(to, label)}
                active={matchesRoute(location.pathname, to)}
              />
            ))}
            <MobileMenuButton active={isMoreActive} onClick={handleOpenSidebar} />
          </div>
        </nav>
      )}

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm lg:hidden"
            onClick={handleCloseSidebar}
          />
        )}
      </AnimatePresence>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isPaletteOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsPaletteOpen(false)}
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-20 z-[101] mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_32px_80px_rgba(0,0,0,0.4)]"
            >
              {/* Search Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <Search size={20} className="text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  placeholder="ابحث عن منتج، عميل، فاتورة أو صفحة..."
                  className="flex-1 bg-transparent text-right text-base font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => setIsPaletteOpen(false)}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-500 hover:bg-slate-200"
                >
                  ESC
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-1.5 custom-scrollbar text-right">
                {paletteResults.length === 0 ? (
                  <p className="text-center py-10 text-sm text-slate-400 font-bold">
                    {paletteSearch ? 'لا توجد نتائج مطابقة' : 'ابدأ الكتابة للبحث في النظام...'}
                  </p>
                ) : (
                  paletteResults.map((item, idx) => {
                    const ItemIcon = item.icon || Search
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setIsPaletteOpen(false)
                          setPaletteSearch('')
                          navigate(item.to)
                        }}
                        className="group flex cursor-pointer items-center gap-4 rounded-2xl p-3.5 transition-colors hover:bg-primary-50 dark:hover:bg-slate-900 border border-transparent hover:border-primary-100 dark:hover:border-slate-800"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                          <ItemIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{item.label}</p>
                          {item.subtitle && (
                            <p className="text-xs text-slate-400 font-bold mt-1">{item.subtitle}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-primary-200 group-hover:text-primary-700 px-2 py-0.5 rounded-full transition-colors">
                          {item.type === 'page' ? 'صفحة' : item.type === 'product' ? 'منتج' : item.type === 'customer' ? 'عميل' : 'فاتورة'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
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
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
          active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="text-[11px] font-black leading-none">{label}</span>
    </NavLink>
  )
}

function MobileMenuButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-[1.4rem] px-2 py-2 text-center transition-all duration-300 ${
        active
          ? 'bg-primary-50 text-primary-700 shadow-[0_10px_24px_rgba(34,92,151,0.12)]'
          : 'text-slate-500'
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
          active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Menu size={20} />
      </span>
      <span className="text-[11px] font-black leading-none">المزيد</span>
    </button>
  )
}
