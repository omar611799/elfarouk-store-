import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
import { Activity, Users, TrendingUp, FileText, Calendar, Search, Award, Clock } from 'lucide-react'

export default function StaffActivity() {
  const { invoices = [] } = useStore()
  const [selectedCashier, setSelectedCashier] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate cashier metrics
  const cashierStats = useMemo(() => {
    const stats = {}

    invoices.forEach(inv => {
      // Fallback for older invoices without cashier info
      const uid = inv.cashierUid || 'unknown'
      const name = inv.cashierName || 'كاشير غير محدد'
      const total = Number(inv.total || 0)
      const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
      const dateKey = date.toDateString()

      if (!stats[uid]) {
        stats[uid] = {
          uid,
          name,
          invoiceCount: 0,
          totalSales: 0,
          dailySales: {},
          invoices: []
        }
      }

      stats[uid].invoiceCount += 1
      stats[uid].totalSales += total
      stats[uid].invoices.push(inv)

      if (!stats[uid].dailySales[dateKey]) {
        stats[uid].dailySales[dateKey] = 0
      }
      stats[uid].dailySales[dateKey] += total
    })

    // Compute best day and average values
    return Object.values(stats).map(cashier => {
      let bestDay = '—'
      let maxSales = 0

      Object.entries(cashier.dailySales).forEach(([day, sales]) => {
        if (sales > maxSales) {
          maxSales = sales
          bestDay = new Date(day).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
        }
      })

      return {
        ...cashier,
        averageInvoice: cashier.invoiceCount > 0 ? cashier.totalSales / cashier.invoiceCount : 0,
        bestDay,
        maxSales
      }
    })
  }, [invoices])

  // Filtered invoices log
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Cashier filter
      const cashierMatch = selectedCashier === 'all' || (inv.cashierUid || 'unknown') === selectedCashier

      // Date filter
      let dateMatch = true
      if (dateFilter) {
        const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
        const filterDate = new Date(dateFilter)
        dateMatch =
          invDate.getDate() === filterDate.getDate() &&
          invDate.getMonth() === filterDate.getMonth() &&
          invDate.getFullYear() === filterDate.getFullYear()
      }

      // Search query (invoice number or customer name)
      let searchMatch = true
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const numberMatch = String(inv.number).includes(query)
        const customerMatch = inv.customerData?.name?.toLowerCase().includes(query)
        const cashierNameMatch = inv.cashierName?.toLowerCase().includes(query)
        searchMatch = numberMatch || customerMatch || cashierNameMatch
      }

      return cashierMatch && dateMatch && searchMatch
    })
  }, [invoices, selectedCashier, dateFilter, searchQuery])

  // Total shop-wide cashier metrics
  const overallMetrics = useMemo(() => {
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const activeStaff = cashierStats.length
    const avgInvoice = invoices.length > 0 ? totalSales / invoices.length : 0

    return {
      totalSales,
      activeStaff,
      avgInvoice
    }
  }, [invoices, cashierStats])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Activity size={20} className="text-cyan-400" />
            </div>
            نشاط الموظفين وتتبع الكاشير
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
            مراقبة مبيعات الموظفين، وتقييم الأداء، وتتبع الفواتير لكل كاشير
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card !p-5 border-cyan-500/10 bg-cyan-500/[0.01]">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">إجمالي مبيعات الوردية</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              {overallMetrics.totalSales.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">ج.م</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-2">مجموع المبيعات المسجلة لجميع الكاشيرات</p>
        </div>

        <div className="card !p-5 border-cyan-500/10 bg-cyan-500/[0.01]">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">متوسط قيمة الفواتير</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              {Math.round(overallMetrics.avgInvoice).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">ج.م</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-2">القيمة المتوسطة للفاتورة الواحدة</p>
        </div>

        <div className="card !p-5 border-cyan-500/10 bg-cyan-500/[0.01]">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">الموظفين النشطين</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              {overallMetrics.activeStaff}
            </span>
            <span className="text-xs font-bold text-slate-400">موظفين</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-2">عدد الكاشيرات المسجلين بالعمليات المفتوحة</p>
        </div>
      </div>

      {/* Staff Leaderboard */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <Award size={16} className="text-cyan-400" />
            جدول أداء الموظفين
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-bold bg-white/[0.005]">
                <th className="px-5 py-3">الموظف</th>
                <th className="px-5 py-3 text-center">عدد الفواتير</th>
                <th className="px-5 py-3 text-left">إجمالي المبيعات</th>
                <th className="px-5 py-3 text-left">متوسط الفاتورة</th>
                <th className="px-5 py-3">أفضل يوم أداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {cashierStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500 font-bold">لا توجد مبيعات مسجلة باسم أي كاشير حالياً</td>
                </tr>
              ) : (
                cashierStats.map(staff => (
                  <tr key={staff.uid} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3 font-black text-sm">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-cyan-400" />
                      </div>
                      {staff.name}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-300">{staff.invoiceCount}</td>
                    <td className="px-5 py-4 text-left font-black text-emerald-400 text-sm">
                      {Math.round(staff.totalSales).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                    </td>
                    <td className="px-5 py-4 text-left font-bold text-slate-300">
                      {Math.round(staff.averageInvoice).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-amber-400 shrink-0" />
                        <span className="font-bold text-slate-300">{staff.bestDay}</span>
                        <span className="text-[10px] text-amber-400 font-black">({Math.round(staff.maxSales).toLocaleString()} ج.م)</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter and Log Section */}
      <div className="space-y-4">
        <h3 className="font-black text-white text-base px-1 flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          سجل عمليات الكاشير التفصيلي
        </h3>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
          {/* Cashier Selector */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 mr-1">تصفية حسب الموظف</label>
            <select
              value={selectedCashier}
              onChange={e => setSelectedCashier(e.target.value)}
              className="select w-full text-xs"
            >
              <option value="all">كل الكاشيرات</option>
              {cashierStats.map(s => (
                <option key={s.uid} value={s.uid}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 mr-1">تصفية بالتاريخ</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input w-full text-xs"
            />
          </div>

          {/* Text Search */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 mr-1">بحث نصي</label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-3 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة أو العميل..."
                className="input w-full pr-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Invoice Log */}
        <div className="space-y-2">
          {filteredInvoices.length === 0 ? (
            <div className="card border-dashed border-white/5 text-center py-16 opacity-40">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا توجد عمليات مطابقة للفلاتر</p>
            </div>
          ) : (
            filteredInvoices.map(inv => {
              const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
              return (
                <div key={inv.id} className="card !p-4 hover:border-white/10 transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">فاتورة #{inv.number}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {inv.customerData?.name || 'نقدي'} • {date.toLocaleDateString('ar-EG')} • {date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-white text-sm">
                      {Number(inv.total || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-500">ج.م</span>
                    </p>
                    <p className="text-[10px] font-black text-cyan-400 mt-0.5">
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
