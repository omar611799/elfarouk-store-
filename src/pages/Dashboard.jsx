import { useStore } from '../context/StoreContext'
import { Package, Users, FileText, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { products, customers, invoices, transactions } = useStore()

  const totalSales    = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const totalProfit   = invoices.reduce((s, i) => s + (i.total || 0) * 0.3, 0)
  const lowStock      = products.filter(p => p.quantity <= (p.minStock || 5))
  const totalProducts = products.length

  // Monthly sales chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('ar-EG', { month: 'short' })
    const total = invoices
      .filter(inv => {
        const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
        return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()
      })
      .reduce((s, inv) => s + (inv.total || 0), 0)
    return { month, total }
  })

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'صافي الأرباح',    value: `${totalProfit.toLocaleString()} ج.م`, icon: ShoppingCart, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: 'قطع الغيار',      value: totalProducts, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'العملاء',         value: customers.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-slate-400 text-sm">مرحباً، إليك نظرة عامة على المتجر</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">المبيعات الشهرية</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} name="المبيعات" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="card border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-400" />
            <h2 className="font-bold text-yellow-400">تنبيهات المخزون ({lowStock.length})</h2>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{p.name}</span>
                <span className="badge-yellow">{p.quantity} قطعة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">آخر الفواتير</h2>
          <span className="text-slate-400 text-xs">{invoices.length} فاتورة</span>
        </div>
        {invoices.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">لا توجد فواتير بعد</p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm text-white font-medium">{inv.customerData?.name || 'عميل'}</p>
                  <p className="text-xs text-slate-400">فاتورة #{inv.number}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary-400">{inv.total?.toLocaleString()} ج.م</p>
                  <span className={inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus === 'partial' ? 'badge-yellow' : 'badge-red'}>
                    {inv.paymentStatus === 'paid' ? 'مدفوع' : inv.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوع'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
