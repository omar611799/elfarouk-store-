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

const PIE_COLORS = ['#f97316', '#0ea5e9', '#10b981', '#8b5cf6']

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-20" dir="rtl">

      {/* ── Row 1: Stats Bar ─────────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="إجمالي المنتجات" value={totalProducts.toLocaleString()} icon={Package}
          trend="+12%" trendUp color="blue" sparkline={[20,35,28,50,40,60,55]} />
        <StatCard label="نواقص المخزون" value={lowStock.length} icon={AlertTriangle}
          trend="ينتظر" trendUp={false} color="amber" sparkline={[50,40,60,30,45,20,15]} />
        <StatCard label="إجمالي المبيعات" value={`${Math.round(totalSales).toLocaleString()} ج.م`} icon={TrendingUp}
          trend="+8.5%" trendUp color="emerald" sparkline={[10,30,20,50,40,70,90]} />
        <StatCard label="الطلبات النشطة" value={activeOrders} icon={ShoppingCart}
          trend={`+${activeOrders}`} trendUp color="orange" sparkline={[5,12,8,14,10,18,16]} />
      </motion.div>

      {/* ── Row 2: Chart + Right Panel ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Main Area Chart — 2/3 width */}
        <motion.div variants={item} className="xl:col-span-2 card !p-0 overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-7 pt-6 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Activity size={20} className="text-orange-500" />
                المبيعات على مدار الوقت
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                تتبع الإيرادات — آخر {period === '7d' ? '7 أيام' : '30 يوم'}
              </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['7d', '30d'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${period === p ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-500 hover:text-slate-800'}`}>
                  {p === '7d' ? 'آخر 7 أيام' : 'آخر 30 يوم'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3.5}
                  fill="url(#grad1)" fillOpacity={1} dot={false} activeDot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} />
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
              <button className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
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
                  className="text-[10px] font-black text-slate-400 hover:text-orange-500 disabled:opacity-30">← السابق</button>
                <span className="text-[9px] font-bold text-slate-300">{stockPage + 1}/{totalStockPages}</span>
                <button onClick={() => setStockPage(p => Math.min(totalStockPages - 1, p + 1))} disabled={stockPage === totalStockPages - 1}
                  className="text-[10px] font-black text-slate-400 hover:text-orange-500 disabled:opacity-30">التالي →</button>
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
              <Activity size={16} className="text-blue-500" />
              نشاط العملاء
            </h3>
            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{recentInvoices.length} عملية</span>
          </div>
          <div className="space-y-4">
            {recentInvoices.length === 0
              ? <EmptyState />
              : recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <ShoppingCart size={15} className="text-blue-500" />
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
              <Bell size={16} className="text-violet-500" />
              تنبيهات المنظومة
            </h3>
            <RefreshCw size={14} className="text-slate-300 cursor-pointer hover:text-orange-500 transition-colors" />
          </div>
          <div className="space-y-5 relative">
            <div className="absolute right-[14px] top-3 bottom-3 w-px bg-slate-100 z-0" />
            <ActivityFeedItem
              icon={CheckCircle2} color="emerald"
              title="فاتورة مكتملة" sub={`INV-#${invoices[0]?.number || '0001'} — ${(invoices[0]?.total || 0).toLocaleString()} ج.م`}
              time="منذ 10 دقائق" />
            <ActivityFeedItem
              icon={Package} color="blue"
              title="تحديث مخزون" sub={`${products[0]?.name || 'منتج'} — ${products[0]?.quantity || 0} قطعة`}
              time="منذ 40 دقيقة" />
            <ActivityFeedItem
              icon={Users} color="orange"
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
                    fill="#f97316" />
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
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5}
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
                    <Pie data={pieData.length ? pieData : [{ name: 'المخزون', value: 1, color: '#f97316' }]}
                      innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {(pieData.length ? pieData : [{ color: '#f97316' }]).map((e, i) =>
                        <Cell key={i} fill={e.color} />
                      )}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                {(pieData.length ? pieData : [{ name: 'المخزون', value: products.length, color: '#f97316' }]).map((d, i) => (
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
        <footer className="mt-4 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <ShoppingCart size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-black text-slate-800">AutoPartsPro</h2>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">
                نظام متكامل لإدارة قطع الغيار والمحلات — مبني للعمل في بيئات التجزئة الاحترافية.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                جميع الأنظمة تعمل  •  v3.1
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">روابط سريعة</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {['لوحة التحكم', 'المخزن', 'الموردين', 'المشتريات', 'الفواتير', 'التقارير'].map(l => (
                  <p key={l} className="text-xs font-semibold text-slate-400 hover:text-orange-500 cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">تواصل معنا</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Mail size={12} className="text-orange-400 shrink-0" />
                  support@autopartspro.example
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Phone size={12} className="text-orange-400 shrink-0" />
                  +966 5X XXX XXXX
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Globe size={12} className="text-orange-400 shrink-0" />
                  autopartspro.example
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-slate-100 gap-3">
            <p className="text-[10px] font-bold text-slate-400">© 2026 AutoPartsPro. جميع الحقوق محفوظة لنظام إدارة الفاروق.</p>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-bold text-slate-300 hover:text-slate-500 cursor-pointer">سياسة الخصوصية</p>
              <p className="text-[10px] font-bold text-slate-300 hover:text-slate-500 cursor-pointer">الشروط والأحكام</p>
              <p className="text-[10px] font-bold text-slate-300 hover:text-slate-500 cursor-pointer">الدعم الفني</p>
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
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    stroke: '#3b82f6' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   stroke: '#f59e0b' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: '#10b981' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  stroke: '#f97316' },
  }
  const p = palette[color] || palette.blue
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
    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
      <span className="text-[11px] font-bold text-slate-500 group-hover:text-orange-600">{label}</span>
      <ChevronDown size={13} className="text-slate-300 group-hover:text-orange-400" />
    </div>
  )
}

function QuickAction({ label, icon: Icon, primary, href }) {
  return (
    <a href={href}
      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-black text-xs group
        ${primary
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600'
          : 'border-2 border-slate-100 text-slate-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/30'}`}>
      <span>{label}</span>
      <Icon size={15} className="group-hover:scale-110 transition-transform" />
    </a>
  )
}

function BestSellerRow({ product, rank }) {
  const max = 100
  const pct = Math.min(100, Math.round((product.units / max) * 100) || (85 - rank * 15))
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500']
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
    blue:    'bg-blue-100 text-blue-600',
    orange:  'bg-orange-100 text-orange-600',
    rose:    'bg-rose-100 text-rose-600',
  }
  return (
    <div className="flex gap-3 relative z-10">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${palette[color]}`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-800">{title}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{sub}</p>
        <p className="text-[9px] font-black text-orange-500 mt-1 uppercase tracking-wide">{time}</p>
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
