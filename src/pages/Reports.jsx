import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Download,
  Package, Users, FileText, Wallet, Calendar, ArrowUpRight
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
  const { products, invoices, expenses, customers } = useStore()
  const [period, setPeriod] = useState('30d')

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalRevenue  = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalProfit   = useMemo(() => {
    const grossProfit = invoices.reduce((s, inv) =>
      s + (inv.items || []).reduce((ss, it) => {
        const cost = it.cost > 0 ? it.cost : it.price * 0.65
        return ss + (it.price - cost) * (it.qty || 1)
      }, 0), 0)
    return grossProfit - totalExpenses
  }, [invoices, totalExpenses])

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
          const cost = it.cost > 0 ? it.cost : it.price * 0.65
          return ss + (it.price - cost) * (it.qty || 1)
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
        map[cat] = (map[cat] || 0) + (it.price * (it.qty || 1))
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
        if (!map[it.name]) map[it.name] = { name: it.name, units: 0, revenue: 0 }
        map[it.name].units   += it.qty || 1
        map[it.name].revenue += (it.price || 0) * (it.qty || 1)
      })
    )
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [invoices])

  // ── Export ────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      invoices.map(i => ({
        'رقم الفاتورة': i.number,
        'العميل':       i.customerData?.name || 'نقدي',
        'الإجمالي':     i.total || 0,
        'الحالة':       i.paymentStatus === 'paid' ? 'مدفوعة' : 'جزئية',
        'التاريخ':      (i.createdAt?.toDate?.() || new Date(i.createdAt || 0)).toLocaleDateString('ar-EG'),
      }))
    ), 'الفواتير')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      products.map(p => ({
        'الاسم': p.name, 'الكمية': p.quantity,
        'السعر': p.price, 'التكلفة': p.cost || 0,
        'الفئة': p.category || 'غير مصنف',
      }))
    ), 'المخزون')
    XLSX.writeFile(wb, `تقرير-الفاروق-${new Date().toLocaleDateString('ar-EG')}.xlsx`)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-20">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
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
                  <Tooltip formatter={v => [`${v.toLocaleString()} ج.م`, 'الإيراد']}
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

      {/* ── Low Stock Table ── */}
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
