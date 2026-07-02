import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
import { Activity, Users, TrendingUp, FileText, Search, Award, Clock } from 'lucide-react'

export default function StaffActivity() {
  const { invoices = [] } = useStore()
  const [selectedCashier, setSelectedCashier] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const cashierStats = useMemo(() => {
    const stats = {}
    invoices.forEach(inv => {
      const uid = inv.cashierUid || 'unknown'
      const name = inv.cashierName || 'كاشير غير محدد'
      const total = Number(inv.total || 0)
      const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
      const dateKey = date.toDateString()

      if (!stats[uid]) {
        stats[uid] = { uid, name, invoiceCount: 0, totalSales: 0, dailySales: {}, invoices: [] }
      }
      stats[uid].invoiceCount += 1
      stats[uid].totalSales += total
      stats[uid].invoices.push(inv)
      if (!stats[uid].dailySales[dateKey]) stats[uid].dailySales[dateKey] = 0
      stats[uid].dailySales[dateKey] += total
    })

    return Object.values(stats).map(cashier => {
      let bestDay = '—', maxSales = 0
      Object.entries(cashier.dailySales).forEach(([day, sales]) => {
        if (sales > maxSales) { maxSales = sales; bestDay = new Date(day).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) }
      })
      return { ...cashier, averageInvoice: cashier.invoiceCount > 0 ? cashier.totalSales / cashier.invoiceCount : 0, bestDay, maxSales }
    })
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const cashierMatch = selectedCashier === 'all' || (inv.cashierUid || 'unknown') === selectedCashier
      let dateMatch = true
      if (dateFilter) {
        const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
        const filterDate = new Date(dateFilter)
        dateMatch = invDate.getDate() === filterDate.getDate() && invDate.getMonth() === filterDate.getMonth() && invDate.getFullYear() === filterDate.getFullYear()
      }
      let searchMatch = true
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        searchMatch = String(inv.number).includes(query) || inv.customerData?.name?.toLowerCase().includes(query) || inv.cashierName?.toLowerCase().includes(query)
      }
      return cashierMatch && dateMatch && searchMatch
    })
  }, [invoices, selectedCashier, dateFilter, searchQuery])

  const overallMetrics = useMemo(() => {
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const activeStaff = cashierStats.length
    const avgInvoice = invoices.length > 0 ? totalSales / invoices.length : 0
    return { totalSales, activeStaff, avgInvoice }
  }, [invoices, cashierStats])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
            <Activity size={20} className="text-cyan-600" />
          </div>
          نشاط الموظفين وتتبع الكاشير
        </h1>
        <p className="text-slate-500 text-xs mt-1">مراقبة مبيعات الموظفين وتقييم الأداء</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي مبيعات الوردية', value: overallMetrics.totalSales.toLocaleString(), unit: 'ج.م', sub: 'مجموع المبيعات لجميع الكاشيرات', color: 'border-cyan-200 bg-cyan-50' },
          { label: 'متوسط قيمة الفواتير', value: Math.round(overallMetrics.avgInvoice).toLocaleString(), unit: 'ج.م', sub: 'القيمة المتوسطة للفاتورة الواحدة', color: 'border-primary-200 bg-primary-50' },
          { label: 'الموظفين النشطين', value: overallMetrics.activeStaff, unit: 'موظفين', sub: 'عدد الكاشيرات بعمليات مسجلة', color: 'border-emerald-200 bg-emerald-50' },
        ].map((card, i) => (
          <div key={i} className={`bg-white border rounded-2xl p-5 shadow-sm ${card.color}`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">{card.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{card.value}</span>
              <span className="text-xs font-bold text-slate-400">{card.unit}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Staff Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          <h3 className="font-black text-slate-700 text-sm">جدول أداء الموظفين</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50/50">
                <th className="px-5 py-3">الموظف</th>
                <th className="px-5 py-3 text-center">عدد الفواتير</th>
                <th className="px-5 py-3 text-left">إجمالي المبيعات</th>
                <th className="px-5 py-3 text-left">متوسط الفاتورة</th>
                <th className="px-5 py-3">أفضل يوم أداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cashierStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-medium">لا توجد مبيعات مسجلة باسم أي كاشير حالياً</td>
                </tr>
              ) : (
                cashierStats.map(staff => (
                  <tr key={staff.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3 font-bold text-sm text-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
                        <Users size={15} className="text-cyan-600" />
                      </div>
                      {staff.name}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-600">{staff.invoiceCount}</td>
                    <td className="px-5 py-4 text-left font-black text-emerald-600 text-sm">
                      {Math.round(staff.totalSales).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                    </td>
                    <td className="px-5 py-4 text-left font-bold text-slate-600">
                      {Math.round(staff.averageInvoice).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-amber-500 shrink-0" />
                        <span className="font-medium text-slate-600">{staff.bestDay}</span>
                        <span className="text-[10px] text-amber-600 font-black">({Math.round(staff.maxSales).toLocaleString()} ج.م)</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters + Log */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-700 text-base flex items-center gap-2">
          <Clock size={16} className="text-cyan-500" />
          سجل عمليات الكاشير التفصيلي
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">تصفية حسب الموظف</label>
            <select value={selectedCashier} onChange={e => setSelectedCashier(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            >
              <option value="all">كل الكاشيرات</option>
              {cashierStats.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">تصفية بالتاريخ</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">بحث نصي</label>
            <div className="relative">
              <Search size={13} className="absolute right-3 top-3 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة أو العميل..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredInvoices.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-12">
              <FileText size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">لا توجد عمليات مطابقة للفلاتر</p>
            </div>
          ) : (
            filteredInvoices.map(inv => {
              const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
              return (
                <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <FileText size={15} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">فاتورة #{inv.number}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {inv.customerData?.name || 'نقدي'} • {date.toLocaleDateString('ar-EG')} • {date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-slate-800 text-sm">
                      {Number(inv.total || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                    </p>
                    <p className="text-[10px] font-bold text-cyan-600 mt-0.5">
                      بواسطة: {inv.cashierName || 'كاشير غير محدد'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}
