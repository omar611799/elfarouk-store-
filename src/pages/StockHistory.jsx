import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { listenCol, COLS } from '../firebase/collections'
import { History, Search, ArrowUpCircle, ArrowDownCircle, Info, Package, Filter, Calendar, Clock, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function StockHistory() {
  const { deleteStockLog } = useStore()
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsub = listenCol(COLS.STOCK_LOGS, (data) => {
      setLogs(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !search || 
        log.productName?.toLowerCase().includes(search.toLowerCase()) || 
        log.note?.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || log.type === typeFilter
      return matchSearch && matchType
    })
  }, [logs, search, typeFilter])

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sale': return { label: 'بيع', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: ArrowDownCircle }
      case 'purchase': return { label: 'شراء', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: ArrowUpCircle }
      case 'stock_in': return { label: 'زيادة يدوية', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: ArrowUpCircle }
      case 'stock_out': return { label: 'صرف يدوي', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: ArrowDownCircle }
      case 'return_deleted_invoice': return { label: 'مرتجع حذف', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: History }
      default: return { label: type, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: Info }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center shadow-sm">
              <History size={20} className="text-primary-600" />
            </div>
            سجل تتبع المخزن
          </h1>
          <p className="text-slate-500 text-xs mt-1">تاريخ كافة الحركات الصادرة والواردة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="ابحث بالاسم، الملاحظة، الكود..." 
            className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all"
          />
        </div>
        <div className="relative min-w-[220px]">
          <Filter size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)} 
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all appearance-none"
          >
            <option value="">كافة أنواع الحركات</option>
            <option value="sale">المبيعات</option>
            <option value="purchase">استيراد (إكسيل)</option>
            <option value="stock_in">إدخال يدوي</option>
            <option value="stock_out">صرف يدوي</option>
            <option value="return_deleted_invoice">مرتجع (حذف)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3.5 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
          <div className="col-span-3">القطعة والبيانات</div>
          <div>النوع</div>
          <div className="text-center">الكمية</div>
          <div className="text-left">الوقت</div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">جاري تحميل السجلات...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-24 text-center">
            <Package size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لا توجد سجلات مطابقة لهذا البحث</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-slate-50">
            {filteredLogs.map(log => {
              const info = getTypeLabel(log.type)
              const Icon = info.icon
              const date = log.createdAt?.toDate?.() || new Date(log.createdAt?.seconds * 1000) || new Date()
              
              return (
                <motion.div 
                  variants={itemVariant} 
                  key={log.id} 
                  className="grid grid-cols-1 lg:grid-cols-6 gap-4 px-6 py-5 items-center hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="lg:col-span-3 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105 ${info.bg}`}>
                      <Icon size={20} className={info.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 font-black text-base leading-tight truncate">{log.productName}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{log.note || 'حركة مخزنية روتينية'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${info.bg} ${info.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${info.color.replace('text-', 'bg-')}`} />
                      {info.label}
                    </span>
                  </div>

                  <div className={`text-center py-2.5 rounded-xl border ${log.delta > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className={`text-lg font-black ${log.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.delta > 0 ? '+' : ''}{log.delta} <span className="text-[10px] font-normal opacity-60">قطعة</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">الرصيد: {log.newQty}</p>
                  </div>

                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock size={11} className="opacity-50" />
                        <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { if(window.confirm('حذف هذا السجل وعكس تأثيره على الكمية؟')) deleteStockLog(log) }}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
