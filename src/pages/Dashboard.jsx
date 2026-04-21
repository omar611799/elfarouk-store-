import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import {
  Package, Users, FileText, TrendingUp, AlertTriangle,
  ShoppingCart, ArrowUpRight, ArrowDownRight, Bell,
  Star, Info, Download, ChevronDown, ChevronLeft,
  Plus, ExternalLink, Filter, Activity, RefreshCw,
  CheckCircle2, Clock, Zap, Mail, Phone, MapPin, Globe
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { motion } from 'framer-motion'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 18 } } }

const PIE_COLORS = ['#225c97', '#4b6786', '#10b981', '#7c93ad']

export default function Dashboard() {
  const { products, customers, invoices, expenses } = useStore()
  const [period, setPeriod] = useState('7d')
  const [stockPage, setStockPage] = useState(0)
  const STOCK_PER_PAGE = 3

  // ─── Calculations ─────────────────────────────────────────────────────────
  const totalProducts = products.length
  const lowStock = products.filter(p => p.quantity <= (p.minStock || 5))

  const totalSales = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'paid')
  const pendingInvoices = invoices.filter(i => i.paymentStatus !== 'paid')
  const activeOrders = pendingInvoices.length

  // Recent 5 invoices
  const recentInvoices = [...invoices].sort((a, b) => {
    const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
    const db2 = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
    return db2 - da
  }).slice(0, 5)

  // Sales history chart
  const salesHistory = useMemo(() => {
    const days = period === '30d' ? 30 : 7
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const label = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
      const daySales = invoices
        .filter(inv => {
          const d = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
          return d.toDateString() === date.toDateString()
        })
        .reduce((s, inv) => s + (inv.total || 0), 0)
      return { name: label, value: daySales }
    })
  }, [invoices, period])

  // Best-selling products (by revenue on invoices)
  const bestSellers = useMemo(() => {
    const map = {}
    invoices.forEach(inv => {
      ;(inv.items || []).forEach(it => {
        if (!map[it.id]) map[it.id] = { id: it.id, name: it.name, category: it.category, image: it.image, units: 0, revenue: 0 }
        map[it.id].units += it.qty || 1
        map[it.id].revenue += (it.price || 0) * (it.qty || 1)
      })
    })
    return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 3)
  }, [invoices])

  // Pie data by category
  const pieData = useMemo(() => {
    const cats = {}
    products.forEach(p => {
      const c = p.category || 'أخرى'
      cats[c] = (cats[c] || 0) + 1
    })
    return Object.entries(cats).slice(0, 4).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i] }))
  }, [products])

  // Bar chart data (monthly or daily)
  const barData = useMemo(() => {
    return [
      { name: 'الج', value: 3200 },
      { name: 'الأر', value: 5800 },
      { name: 'الخ', value: 2800 },
      { name: 'الس', value: 4900 },
      { name: 'الأح', value: 6200 },
      { name: 'الإث', value: 5100 },
      { name: 'الث', value: 7400 },
    ]
  }, [])

  // Paginated stock list
  const stockList = products.slice(stockPage * STOCK_PER_PAGE, (stockPage + 1) * STOCK_PER_PAGE)
  const totalStockPages = Math.ceil(products.length / STOCK_PER_PAGE)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 sm:space-y-8" dir="rtl">

      <motion.div variants={item} className="overflow-hidden rounded-[2rem] border border-primary-100 bg-white shadow-[0_24px_70px_rgba(15,34,56,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.25fr,0.95fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f2238_0%,#164c7e_58%,#225c97_100%)] p-5 text-white sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_32%)]" />
            <div className="relative flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="rounded-[1.6rem] bg-white p-2.5 shadow-[0_20px_50px_rgba(8,17,28,0.24)]">
                  <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-primary-100/90 sm:text-[11px]">ELFAROUK SERVICE</p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">لوحة التشغيل اليومية</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-primary-50/90 sm:text-base">
                متابعة واضحة للمبيعات والمخزون والعملاء مع هوية بصرية متناسقة على الديسكتوب والموبايل.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-100">مبيعات اليوم</p>
                  <p className="mt-2 text-xl font-black">{Math.round(totalSales).toLocaleString()} ج.م</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-100">عملاء نشطون</p>
                  <p className="mt-2 text-xl font-black">{customers.length}</p>
                </div>
                <div className="col-span-2 rounded-[1.35rem] border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-100">تنبيهات المخزون</p>
                  <p className="mt-2 text-xl font-black">{lowStock.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 bg-slate-50/80 p-5 sm:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary-600">جاهزية اليوم</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">
                {lowStock.length > 0 ? 'فيه عناصر تحتاج متابعة' : 'الوضع مستقر ومهيأ للبيع'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                استخدم الاختصارات السريعة للوصول إلى الكاشير أو المخزن أو مراجعة التقارير من نفس الواجهة.
              </p>
            </div>
            <div className="grid gap-3">
              <QuickAction label="الدخول إلى نقطة البيع" icon={ShoppingCart} primary href="/pos" />
              <QuickAction label="فتح صفحة التقارير" icon={ExternalLink} href="/reports" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Row 1: Stats Bar ─────────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-5">
        <StatCard label="إجمالي المنتجات" value={totalProducts.toLocaleString()} icon={Package}
          trend="+12%" trendUp color="primary" sparkline={[20,35,28,50,40,60,55]} />
        <StatCard label="نواقص المخزون" value={lowStock.length} icon={AlertTriangle}
          trend="ينتظر" trendUp={false} color="amber" sparkline={[50,40,60,30,45,20,15]} />
        <StatCard label="إجمالي المبيعات" value={`${Math.round(totalSales).toLocaleString()} ج.م`} icon={TrendingUp}
          trend="+8.5%" trendUp color="emerald" sparkline={[10,30,20,50,40,70,90]} />
        <StatCard label="الطلبات النشطة" value={activeOrders} icon={ShoppingCart}
          trend={`+${activeOrders}`} trendUp color="primary" sparkline={[5,12,8,14,10,18,16]} />
      </motion.div>

      {/* ── Row 2: Chart + Right Panel ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Main Area Chart — 2/3 width */}
        <motion.div variants={item} className="xl:col-span-2 card !p-0 overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 pb-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Activity size={20} className="text-primary-500" />
                المبيعات على مدار الوقت
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                تتبع الإيرادات — آخر {period === '7d' ? '7 أيام' : '30 يوم'}
              </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['7d', '30d'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${period === p ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25' : 'text-slate-500 hover:text-slate-800'}`}>
                  {p === '7d' ? 'آخر 7 أيام' : 'آخر 30 يوم'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[260px] px-3 py-4 sm:h-[300px] sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#225c97" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#225c97" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ background: '#fff', borderRadius: 14, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'right', fontSize: 12 }}
                  formatter={(v) => [`${v.toLocaleString()} ج.م`, 'المبيعات']}
                />
                <Area type="monotone" dataKey="value" stroke="#225c97" strokeWidth={3.5}
                  fill="url(#grad1)" fillOpacity={1} dot={false} activeDot={{ r: 6, fill: '#225c97', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Panel: Stock Table + Quick Actions */}
        <motion.div variants={item} className="flex flex-col gap-5">

          {/* Filter Selects */}
          <div className="card !p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-black text-slate-800 text-sm">حالة المخزون</h3>
              <button className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
                <Download size={13} />
              </button>
            </div>
            <FilterChip label="الفئة: الكل" />
            <FilterChip label="المورد: الكل" />
            <FilterChip label="حالة المخزون: الكل" />

            {/* Mini Table */}
            <div className="pt-1 divide-y divide-slate-50">
              {products.length === 0
                ? <p className="text-center text-slate-400 text-xs py-4">لا توجد منتجات</p>
                : stockList.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package size={14} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{p.sku || 'SKU–'}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${p.quantity <= (p.minStock || 5) ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.quantity}
                    </span>
                    <span className="text-[10px] font-black text-slate-700 shrink-0">{p.price} ج</span>
                  </div>
                ))
              }
            </div>

            {/* Pagination */}
            {totalStockPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <button onClick={() => setStockPage(p => Math.max(0, p - 1))} disabled={stockPage === 0}
                  className="text-[10px] font-black text-slate-400 hover:text-primary-600 disabled:opacity-30">← السابق</button>
                <span className="text-[9px] font-bold text-slate-300">{stockPage + 1}/{totalStockPages}</span>
                <button onClick={() => setStockPage(p => Math.min(totalStockPages - 1, p + 1))} disabled={stockPage === totalStockPages - 1}
                  className="text-[10px] font-black text-slate-400 hover:text-primary-600 disabled:opacity-30">التالي →</button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card !p-5 space-y-3">
            <h3 className="font-black text-slate-800 text-sm mb-1">إجراءات سريعة</h3>
            <QuickAction label="كاشير مبيعات جديد" icon={ShoppingCart} primary href="/pos" />
            <QuickAction label="مورد جديد" icon={Users} href="/suppliers" />
            <QuickAction label="تصدير تقرير الجرد" icon={ExternalLink} href="/reports" />
          </div>

        </motion.div>
      </div>

      {/* ── Row 3: Best Sellers + Customer Activity + Stock Table ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Best Sellers */}
        <motion.div variants={item} className="card !p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-400" />
              الأكثر مبيعاً
            </h3>
            <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">هذا الشهر</span>
          </div>
          <div className="space-y-5">
            {bestSellers.length > 0
              ? bestSellers.map((p, i) => <BestSellerRow key={p.id} product={p} rank={i + 1} />)
              : products.slice(0, 3).map((p, i) => <BestSellerRow key={p.id} product={{ ...p, units: 85 - i * 18, revenue: p.price * (85 - i * 18) }} rank={i + 1} />)
            }
          </div>
        </motion.div>

        {/* Customer Activity — Recent Invoices */}
        <motion.div variants={item} className="card !p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-primary-500" />
              نشاط العملاء
            </h3>
            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{recentInvoices.length} عملية</span>
          </div>
          <div className="space-y-4">
            {recentInvoices.length === 0
              ? <EmptyState />
              : recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                    <ShoppingCart size={15} className="text-primary-600 group-hover:text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{inv.customerData?.name || 'عميل نقدي'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">فاتورة #{inv.number || inv.id?.slice(-4)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-800">{(inv.total || 0).toLocaleString()} <span className="text-[9px] text-slate-400">ج.م</span></p>
                    <p className={`text-[10px] font-black uppercase ${inv.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {inv.paymentStatus === 'paid' ? 'مدفوع' : 'جزئي'}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Summary Totals */}
          {invoices.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-emerald-600">{paidInvoices.length}</p>
                <p className="text-[10px] font-bold text-emerald-500">مكتملة</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-amber-600">{pendingInvoices.length}</p>
                <p className="text-[10px] font-bold text-amber-500">معلقة</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div variants={item} className="card !p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              تنبيهات المنظومة
            </h3>
            <RefreshCw size={14} className="text-slate-300 cursor-pointer hover:text-primary-500 transition-colors" />
          </div>
          <div className="space-y-5 relative">
            <div className="absolute right-[14px] top-3 bottom-3 w-px bg-slate-100 z-0" />
            <ActivityFeedItem
              icon={CheckCircle2} color="emerald"
              title="فاتورة مكتملة" sub={`INV-#${invoices[0]?.number || '0001'} — ${(invoices[0]?.total || 0).toLocaleString()} ج.م`}
              time="منذ 10 دقائق" />
            <ActivityFeedItem
              icon={Package} color="primary"
              title="تحديث مخزون" sub={`${products[0]?.name || 'منتج'} — ${products[0]?.quantity || 0} قطعة`}
              time="منذ 40 دقيقة" />
            <ActivityFeedItem
              icon={Users} color="primary"
              title="عميل جديد" sub={`${customers[0]?.name || 'عميل'} — ${customers[0]?.phone || '05X XXX XXXX'}`}
              time="منذ ساعتين" />
            {lowStock.length > 0 && (
              <ActivityFeedItem
                icon={AlertTriangle} color="rose"
                title="تحذير مخزون" sub={`${lowStock[0]?.name} — ${lowStock[0]?.quantity} قطعة فقط`}
                time="منذ 3 ساعات" />
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Row 4: Quick Reports ─────────────────────────────────── */}
      <motion.div variants={item} className="card !p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-7 pt-6 pb-5 border-b border-slate-100">
          <h3 className="font-black text-slate-800">تقارير سريعة</h3>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-black rounded-lg hover:bg-slate-100 transition-colors">Excel</button>
            <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-black rounded-lg hover:bg-slate-100 transition-colors">PDF</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
          {/* Bar Chart */}
          <div className="p-5">
            <p className="text-[11px] font-black text-slate-500 mb-4 uppercase tracking-wider">مبيعات أيام الأسبوع</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}
                    fill="#225c97" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Sparkline */}
          <div className="p-5">
            <p className="text-[11px] font-black text-slate-500 mb-4 uppercase tracking-wider">منحنى الإيرادات</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesHistory.slice(-14)}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#225c97" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#225c97" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#225c97" strokeWidth={2.5}
                    fill="url(#sparkGrad)" dot={false} />
                  <Tooltip formatter={v => [`${v.toLocaleString()} ج.م`]} contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="p-5">
            <p className="text-[11px] font-black text-slate-500 mb-4 uppercase tracking-wider">توزيع المخزون</p>
            <div className="flex items-center gap-4">
              <div className="h-[130px] w-[130px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData.length ? pieData : [{ name: 'المخزون', value: 1, color: '#225c97' }]}
                      innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {(pieData.length ? pieData : [{ color: '#225c97' }]).map((e, i) =>
                        <Cell key={i} fill={e.color} />
                      )}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                {(pieData.length ? pieData : [{ name: 'المخزون', value: products.length, color: '#225c97' }]).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-slate-600 truncate">{d.name}</span>
                    <span className="text-[10px] font-black text-slate-800 mr-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Row 5: Footer ────────────────────────────────────────── */}
      <motion.div variants={item}>
        <footer className="mt-4 border-t border-slate-200/80 pt-8">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-[1.2fr,1fr,1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-[1.5rem] bg-white p-2 shadow-[0_14px_35px_rgba(34,92,151,0.12)] ring-1 ring-primary-100">
                  <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-14 w-14 object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary-600">ELFAROUK SERVICE</p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">هوية أوضح وتجربة أسرع</h2>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-500">
                تصميم متناسق مع الشعار، وتباين أعلى للعناصر الأساسية، ومظهر أفضل للاستخدام اليومي على الموبايل.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-primary-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                system ready
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-slate-700">نظرة تشغيلية</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">عدد العملاء</span>
                  <span className="text-sm font-black text-slate-900">{customers.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">فواتير معلقة</span>
                  <span className="text-sm font-black text-amber-600">{pendingInvoices.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">نواقص المخزون</span>
                  <span className="text-sm font-black text-primary-700">{lowStock.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-slate-700">تنقل سريع</h4>
              <div className="grid grid-cols-2 gap-2">
                {['لوحة التحكم', 'المخزن', 'الموردين', 'الفواتير', 'التقارير', 'العملاء'].map(l => (
                  <div key={l} className="rounded-2xl bg-primary-50/60 px-3 py-3 text-center text-xs font-black text-primary-700">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <p className="text-[10px] font-bold text-slate-400">© 2026 ELFAROUK Service. جميع الحقوق محفوظة لنظام إدارة الفاروق.</p>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300">
              <span className="cursor-pointer hover:text-primary-600">سياسة الخصوصية</span>
              <span className="cursor-pointer hover:text-primary-600">الشروط والأحكام</span>
              <span className="cursor-pointer hover:text-primary-600">الدعم الفني</span>
            </div>
          </div>
        </footer>
      </motion.div>

    </motion.div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, trend, trendUp, color, sparkline }) {
  const palette = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', stroke: '#225c97' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   stroke: '#f59e0b' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: '#10b981' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   stroke: '#64748b' },
  }
  const p = palette[color] || palette.primary
  const data = sparkline.map(v => ({ v }))

  return (
    <motion.div variants={item} className="stat-card flex flex-col gap-1 overflow-hidden group hover-lift relative">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${p.bg} ${p.text} transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon size={22} />
        </div>
        <span className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {trend}
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="text-2xl font-black text-slate-800 font-display tracking-tight">{value}</p>
      <div className="h-12 w-full mt-2 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={p.stroke} stopOpacity={0.2} />
                <stop offset="95%" stopColor={p.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={p.stroke} strokeWidth={2.5}
              fill={`url(#sg-${color})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function FilterChip({ label }) {
  return (
    <div className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition-all hover:border-primary-200 hover:bg-primary-50/50">
      <span className="text-[11px] font-bold text-slate-500 group-hover:text-primary-700">{label}</span>
      <ChevronDown size={13} className="text-slate-300 group-hover:text-primary-500" />
    </div>
  )
}

function QuickAction({ label, icon: Icon, primary, href }) {
  return (
    <a href={href}
      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-black text-xs group
        ${primary
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700'
          : 'border-2 border-slate-100 text-slate-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/40'}`}>
      <span>{label}</span>
      <Icon size={15} className="group-hover:scale-110 transition-transform" />
    </a>
  )
}

function BestSellerRow({ product, rank }) {
  const max = 100
  const pct = Math.min(100, Math.round((product.units / max) * 100) || (85 - rank * 15))
  const colors = ['bg-primary-600', 'bg-steel-500', 'bg-emerald-500']
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform overflow-hidden relative">
        {product.image
          ? <img src={product.image} className="w-full h-full object-cover" />
          : <Package size={20} className="text-slate-400" />}
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-700 flex items-center justify-center shadow-sm">
          {rank}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-800 truncate">{product.name}</p>
        <p className="text-[9px] text-slate-400 font-bold mb-2">{product.category || 'بدون فئة'}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, delay: rank * 0.15 }}
              className={`h-full rounded-full ${colors[rank - 1] || 'bg-slate-400'}`} />
          </div>
          <span className="text-[10px] font-black text-slate-600 shrink-0">{product.units || pct} قطعة</span>
        </div>
      </div>
    </div>
  )
}

function ActivityFeedItem({ icon: Icon, color, title, sub, time }) {
  const palette = {
    emerald: 'bg-emerald-100 text-emerald-600',
    primary: 'bg-primary-100 text-primary-600',
    rose:    'bg-rose-100 text-rose-600',
    slate:   'bg-slate-100 text-slate-600',
  }
  return (
    <div className="flex gap-3 relative z-10">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${palette[color]}`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-800">{title}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{sub}</p>
        <p className="text-[9px] font-black text-primary-600 mt-1 uppercase tracking-wide">{time}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-8 opacity-30">
      <Activity size={36} className="mb-2" />
      <p className="text-xs font-bold">لا توجد عمليات بعد</p>
    </div>
  )
}
