import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Download,
  Package, FileText, Wallet, Calendar, ArrowUpRight, Users,
  Hourglass, AlertOctagon, Flame, Coins, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import * as XLSX from 'xlsx'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }

const PIE_COLORS = ['#225c97', '#4b6786', '#10b981', '#7c93ad', '#f43f5e', '#eab308']

export default function Reports() {
  const { products, invoices, expenses, customers = [], purchases = [], suppliers = [], transactions = [] } = useStore()
  const [period, setPeriod] = useState('30d')
  const [deadStockDays, setDeadStockDays] = useState(60)

  // ── Dead Stock & Capital Freeze Analyzer ───────────────────────────────────
  const deadStockAnalysis = useMemo(() => {
    const now = Date.now()
    const productLastSaleMap = {}

    invoices.forEach(inv => {
      const invTime = inv.createdAt?.toDate?.() 
        ? inv.createdAt.toDate().getTime() 
        : (inv.createdAt ? new Date(inv.createdAt).getTime() : 0)
      ;(inv.items || []).forEach(it => {
        const pId = it._originalId || it.id
        if (!productLastSaleMap[pId] || invTime > productLastSaleMap[pId]) {
          productLastSaleMap[pId] = invTime
        }
      })
    })

    const stagnantItems = products
      .filter(p => Number(p.quantity || 0) > 0)
      .map(p => {
        const lastSaleTime = productLastSaleMap[p.id] || 0
        const daysSinceLastSale = lastSaleTime > 0 
          ? Math.floor((now - lastSaleTime) / (24 * 60 * 60 * 1000))
          : 999
        const unitCost = Number(p.cost || p.price * 0.7 || 0)
        const frozenCapital = Number(p.quantity || 0) * unitCost
        return {
          ...p,
          daysSinceLastSale,
          frozenCapital,
          unitCost,
          hasNeverSold: lastSaleTime === 0,
        }
      })
      .filter(p => p.daysSinceLastSale >= deadStockDays)
      .sort((a, b) => b.frozenCapital - a.frozenCapital)

    const totalFrozenCapital = stagnantItems.reduce((sum, item) => sum + item.frozenCapital, 0)

    return {
      items: stagnantItems,
      totalFrozenCapital,
      count: stagnantItems.length,
    }
  }, [products, invoices, deadStockDays])

  const exportDeadStockToExcel = () => {
    if (deadStockAnalysis.items.length === 0) return
    const wb = XLSX.utils.book_new()
    const data = deadStockAnalysis.items.map((item, idx) => ({
      'م': idx + 1,
      'اسم القطعة': item.name,
      'كود الصنف / SKU': item.sku || '—',
      'الفئة': item.category || 'عام',
      'الكمية الراكدة': item.quantity,
      'سعر التكلفة للقطعة': item.unitCost,
      'سعر البيع': item.price,
      'إجمالي رأس المال المجمد': item.frozenCapital,
      'مدة الركود': item.hasNeverSold ? 'لم تُبع من قبل' : `${item.daysSinceLastSale} يوم`,
      'المورد': item.supplier || '—',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'البضاعة الراكدة')
    XLSX.writeFile(wb, `تقرير_البضاعة_الراكدة_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalRevenue  = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalProfit   = useMemo(() => {
    const grossProfit = invoices.reduce((s, inv) =>
      s + (inv.items || []).reduce((ss, it) => {
        const cost = Number(it.cost) || 0
        const effectiveQty = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0))
        return ss + (it.price - cost) * effectiveQty
      }, 0), 0)
    return grossProfit - totalExpenses
  }, [invoices, totalExpenses])

  // ── Cashier Performance Chart Data ──────────────────────────────────────
  const cashierSales = useMemo(() => {
    const map = {}
    invoices.forEach(inv => {
      const name = inv.cashierName || 'كاشير غير محدد'
      map[name] = (map[name] || 0) + Number(inv.total || 0)
    })
    return Object.entries(map).map(([name, sales]) => ({ name, sales: Math.round(sales) }))
  }, [invoices])

  // ── Top Customers ─────────────────────────────────────────────────────────
  const topCustomersList = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5)
  }, [customers])

  // ── Returns vs Sales/Purchases ───────────────────────────────────────────
  const returnsMetrics = useMemo(() => {
    const totalSales = totalRevenue
    const totalSalesReturns = transactions
      .filter(t => t.type === 'return')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0)
    const totalSupplierReturns = transactions
      .filter(t => t.type === 'supplier_return')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

    return [
      { name: 'مبيعات vs مرتجع مبيعات', 'المبيعات': Math.round(totalSales), 'المرتجعات': Math.round(totalSalesReturns) },
      { name: 'مشتريات vs مرتجع مشتريات', 'المشتريات': Math.round(totalPurchases), 'المرتجعات': Math.round(totalSupplierReturns) }
    ]
  }, [transactions, purchases, totalRevenue])

  // ── Sales history ─────────────────────────────────────────────────────────
  const salesHistory = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const label = period === '7d'
        ? date.toLocaleDateString('ar-EG', { weekday: 'short' })
        : date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
      const dayInvoices = invoices.filter(inv => {
        const d = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
        return d.toDateString() === date.toDateString()
      })
      const revenue = dayInvoices.reduce((s, inv) => s + (inv.total || 0), 0)
      const profit  = dayInvoices.reduce((s, inv) =>
        s + (inv.items || []).reduce((ss, it) => {
          const cost = Number(it.cost) || 0
          const effectiveQty = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0))
          return ss + (it.price - cost) * effectiveQty
        }, 0), 0)
      return { name: label, revenue, profit }
    })
  }, [invoices, period])

  // ── Category sales pie ────────────────────────────────────────────────────
  const categoryPie = useMemo(() => {
    const map = {}
    invoices.forEach(inv =>
      (inv.items || []).forEach(it => {
        const cat = it.category || 'أخرى'
        const effectiveQty = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0))
        map[cat] = (map[cat] || 0) + (it.price * effectiveQty)
      })
    )
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [invoices])

  // ── Top products ──────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map = {}
    invoices.forEach(inv =>
      (inv.items || []).forEach(it => {
        const effectiveQty = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0))
        if (effectiveQty <= 0) return
        if (!map[it.name]) map[it.name] = { name: it.name, units: 0, revenue: 0 }
        map[it.name].units   += effectiveQty
        map[it.name].revenue += (it.price || 0) * effectiveQty
      })
    )
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [invoices])

  // ── Export ────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // 1. Invoices Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      invoices.map(i => ({
        'رقم الفاتورة': i.number,
        'العميل':       i.customerData?.name || 'نقدي',
        'الإجمالي':     i.total || 0,
        'الحالة':       i.paymentStatus === 'paid' ? 'مدفوعة' : 'جزئية',
        'الكاشير':      i.cashierName || 'غير حدد',
        'التاريخ':      (i.createdAt?.toDate?.() || new Date(i.createdAt || 0)).toLocaleDateString('ar-EG'),
      }))
    ), 'الفواتير')
    
    // 2. Inventory Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      products.map(p => ({
        'الاسم': p.name, 'الكمية': p.quantity,
        'السعر': p.price, 'التكلفة': p.cost || 0,
        'الفئة': p.category || 'غير مصنف',
      }))
    ), 'المخزون')

    // 3. Expenses Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      expenses.map(e => ({
        'البند/المصروف': e.category || e.name || 'أخرى',
        'المبلغ': e.amount || 0,
        'ملاحظات': e.notes || '',
        'التاريخ': (e.createdAt?.toDate?.() || new Date(e.createdAt || 0)).toLocaleDateString('ar-EG'),
      }))
    ), 'المصروفات')

    // 4. Purchases Sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      purchases.map(p => {
        const supplier = suppliers.find(s => s.id === p.supplierId)
        return {
          'رقم فاتورة المورد': p.billNumber || '—',
          'المورد': supplier?.name || 'مورد غير معروف',
          'الإجمالي': p.total || 0,
          'المدفوع': p.paidAmount || 0,
          'المتبقي': p.dueAmount || 0,
          'التاريخ': (p.createdAt?.toDate?.() || new Date(p.createdAt || 0)).toLocaleDateString('ar-EG'),
        }
      })
    ), 'المشتريات')

    XLSX.writeFile(wb, `تقرير-الفاروق-${new Date().toLocaleDateString('ar-EG')}.xlsx`)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-20">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center">
              <BarChart3 size={20} className="text-violet-600" />
            </span>
            التقارير والتحليلات
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1">لوحة تحكم المبيعات والأداء التشغيلي</p>
        </div>
        <button onClick={exportExcel} className="btn-primary">
          <Download size={15} /> تصدير Excel
        </button>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="إجمالي الإيرادات" value={`${Math.round(totalRevenue).toLocaleString()} ج.م`} icon={Wallet} color="primary" trend="+8.2%" />
        <KPICard label="صافي الربح"       value={`${Math.round(totalProfit).toLocaleString()} ج.م`} icon={TrendingUp} color="emerald" trend="+5.1%" />
        <KPICard label="عدد الفواتير"     value={invoices.length} icon={FileText} color="blue" trend={`+${Math.min(invoices.length, 30)}`} />
        <KPICard label="قيمة المخزون"     value={`${Math.round(products.reduce((s, p) => s + (p.price * p.quantity), 0)).toLocaleString()} ج.م`} icon={Package} color="violet" trend="" />
      </motion.div>

      {/* ── Period Selector ── */}
      <motion.div variants={item} className="flex items-center gap-2">
        <Calendar size={15} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-400 ml-1">الفترة:</span>
        {[['7d','٧ أيام'], ['30d','٣٠ يوم'], ['90d','٩٠ يوم']].map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all
              ${period === key ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' : 'bg-white border border-slate-200 text-slate-500 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </motion.div>

      {/* ── Main Chart: Revenue vs Profit ── */}
      <motion.div variants={item} className="card !p-0 overflow-hidden">
        <div className="px-7 pt-6 pb-5 border-b border-slate-100">
          <h2 className="font-black text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-600" />
            الإيرادات مقابل الأرباح
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">مقارنة أداء المبيعات — آخر {period === '7d' ? '٧ أيام' : period === '30d' ? '٣٠ يوم' : '٩٠ يوم'}</p>
        </div>
        <div className="h-[320px] px-4 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesHistory}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#225c97" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#225c97" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ background: '#fff', borderRadius: 14, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', fontSize: 12, textAlign: 'right' }}
                formatter={(v, n) => [`${v.toLocaleString()} ج.م`, n === 'revenue' ? 'الإيرادات' : 'الأرباح']}
              />
              <Legend formatter={v => v === 'revenue' ? 'الإيرادات' : 'الأرباح'} />
              <Area type="monotone" dataKey="revenue" stroke="#225c97" strokeWidth={3}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#225c97' }} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3}
                fill="url(#profGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Row: Cashier Performance + Returns Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashier Performance */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-primary-600" />
              أداء مبيعات الكاشير
            </h3>
          </div>
          {cashierSales.length === 0 ? (
            <div className="py-16 text-center text-slate-350">
              <p className="text-sm font-bold">لا توجد مبيعات مسجلة للكاشير</p>
            </div>
          ) : (
            <div className="h-[280px] px-4 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashierSales} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                  <Tooltip formatter={v => [`${v.toLocaleString()} ج.م`, 'المبيعات']}
                    contentStyle={{ background: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: 11 }} />
                  <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Returns Comparison */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-rose-500" />
              المرتجعات مقابل العمليات الأصلية
            </h3>
          </div>
          <div className="h-[280px] px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnsMetrics} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: 11 }} />
                <Legend />
                <Bar dataKey="المبيعات" fill="#225c97" radius={[6, 6, 0, 0]} />
                <Bar dataKey="المشتريات" fill="#4b6786" radius={[6, 6, 0, 0]} />
                <Bar dataKey="المرتجعات" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Row: Top Products Bar + Category Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Products */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800">أفضل المنتجات مبيعاً</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-300">
              <Package size={40} className="mx-auto mb-3" />
              <p className="text-sm font-bold">لا توجد بيانات مبيعات بعد</p>
            </div>
          ) : (
            <div className="h-[280px] px-4 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                  <XAxis type="number" axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                    tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip formatter={v => [`${v.toLocaleString()} ج.م`, 'المبيعات']}
                    contentStyle={{ background: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="#225c97" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Category Pie */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800">توزيع المبيعات بالفئة</h3>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPie.length ? categoryPie : [{ name: 'لا بيانات', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value" strokeWidth={0}
                  >
                    {(categoryPie.length ? categoryPie : [{ name: 'x' }]).map((_, i) =>
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip formatter={v => [`${v.toLocaleString()} ج.م`]}
                    contentStyle={{ background: '#fff', borderRadius: 12, border: 'none', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              {(categoryPie.length ? categoryPie : []).map((d, i) => {
                const total = categoryPie.reduce((s, x) => s + x.value, 0)
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-700 truncate">{d.name}</span>
                        <span className="text-[10px] font-black text-slate-500 shrink-0 mr-2">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {categoryPie.length === 0 && (
                <p className="text-sm text-slate-400 font-bold text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Row: Top Customers + Low Stock Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Customers */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-primary-600" />
              العملاء الأكثر إنفاقاً
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topCustomersList.length === 0 ? (
              <div className="py-12 text-center text-slate-300">
                <p className="text-sm font-bold">لا يوجد عملاء مسجلين بعد</p>
              </div>
            ) : (
              topCustomersList.map((cust, i) => (
                <div key={cust.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{cust.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{cust.phone || 'بدون هاتف'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-800 text-sm">
                      {Number(cust.totalSpent || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ج.م</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">{cust.invoiceCount || 0} فواتير</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Low Stock Table */}
        <motion.div variants={item} className="card !p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              منتجات تحتاج إعادة طلب
            </h3>
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
              {products.filter(p => p.quantity <= (p.minStock || 5)).length} منتج
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black text-slate-400 uppercase">
                  <th className="px-6 py-3">المنتج</th>
                  <th className="px-4 py-3 text-center">المخزون</th>
                  <th className="px-4 py-3 text-center">الحد الأدنى</th>
                  <th className="px-4 py-3 text-center">الفئة</th>
                  <th className="px-4 py-3 text-left">السعر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products
                  .filter(p => p.quantity <= (p.minStock || 5))
                  .slice(0, 10)
                  .map(p => (
                    <tr key={p.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-black text-slate-800 text-sm">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{p.sku || '–'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-rose-600 font-black text-base">{p.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-slate-500 font-bold text-sm">{p.minStock || 5}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{p.category || '–'}</span>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <span className="font-black text-slate-800">{Number(p.price).toLocaleString()} ج</span>
                      </td>
                    </tr>
                  ))}
                {products.filter(p => p.quantity <= (p.minStock || 5)).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">
                      ✅ جميع المنتجات فوق الحد المطلوب
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Dead Stock & Capital Freeze Analyzer ── */}
      <motion.div variants={item} className="card !p-0 overflow-hidden border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-6 py-5 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Hourglass size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                كاشف البضاعة الراكدة وتجميد السيولة (Dead Stock Analyzer)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                قطع الغيار الموجودة بالمخزن بدون أي حركة بيع خلال الفترة المحددة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black">
              {[
                { label: 'شهر (30 يوم)', val: 30 },
                { label: 'شهرين (60 يوم)', val: 60 },
                { label: '3 أشهر (90 يوم)', val: 90 },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setDeadStockDays(opt.val)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    deadStockDays === opt.val
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={exportDeadStockToExcel}
              disabled={deadStockAnalysis.items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              <Download size={14} /> تصدير الكشف
            </button>
          </div>
        </div>

        {/* Dead Stock Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-amber-50/10 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي رأس المال المجمد</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {Math.round(deadStockAnalysis.totalFrozenCapital).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">ج.م</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">سيولة متوقفة في قطع غير متحركة</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">عدد الأصناف الراكدة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {deadStockAnalysis.count}
              </span>
              <span className="text-xs font-bold text-slate-400">صنف</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">من إجمالي {products.length} صنف بالمخزن</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">اقتراح الإدارة والتصفية</span>
            <p className="text-xs font-black text-primary-600 dark:text-primary-400 mt-1">
              تطبيق خصم تصفية 10-15% أو تضمينها كعروض مجمعة مع الصيانات الدورية
            </p>
          </div>
        </div>

        {/* Dead Stock Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
              <tr>
                <th className="p-3.5">اسم القطعة / الكود</th>
                <th className="p-3.5">الفئة</th>
                <th className="p-3.5 text-center">الكمية الراكدة</th>
                <th className="p-3.5 text-center">سعر التكلفة</th>
                <th className="p-3.5 text-center">رأس المال المجمد</th>
                <th className="p-3.5 text-center">مدة الركود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deadStockAnalysis.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-emerald-600 font-black text-sm">
                    ✨ ممتاز! لا توجد قطع غيار راكدة خلال الـ {deadStockDays} يوم الماضية
                  </td>
                </tr>
              ) : (
                deadStockAnalysis.items.slice(0, 15).map(item => (
                  <tr key={item.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors">
                    <td className="p-3.5 font-black text-slate-800 dark:text-slate-100">
                      <div>{item.name}</div>
                      {item.sku && <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>}
                    </td>
                    <td className="p-3.5 font-bold text-slate-500 dark:text-slate-400">
                      {item.category || 'عام'}
                    </td>
                    <td className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400">
                      {item.quantity} قطعة
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-300">
                      {item.unitCost} ج.م
                    </td>
                    <td className="p-3.5 text-center font-black text-rose-600 dark:text-rose-400">
                      {Math.round(item.frozenCapital).toLocaleString()} ج.م
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap font-bold">
                      {item.hasNeverSold ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-black">
                          لم تُبع إطلاقاً
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.daysSinceLastSale} يوم
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {deadStockAnalysis.items.length > 15 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-center text-xs text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800">
              معروض أول 15 صنف راكد. اضغط على زر "تصدير الكشف" لتحميل القائمة الكاملة بملف Excel.
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  )
}

function KPICard({ label, value, icon: Icon, color, trend }) {
  const palette = {
    primary: { bg: 'bg-primary-50', icon: 'bg-primary-100 text-primary-600', val: 'text-primary-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700' },
    violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600',  val: 'text-violet-700' },
  }
  const p = palette[color]
  return (
    <div className={`card !p-5 ${p.bg} border-0`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${p.icon}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
            <ArrowUpRight size={11} /> {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-black tracking-tight ${p.val}`}>{value}</p>
    </div>
  )
}
