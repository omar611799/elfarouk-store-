import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { listenCol, COLS } from '../firebase/collections'
import { History, Search, ArrowUpCircle, ArrowDownCircle, Info, Package, Filter, Calendar, Clock, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function StockHistory() {
  const { products } = useStore()
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
        log.note?.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || log.type === typeFilter;
      return matchSearch && matchType;
    })
  }, [logs, search, typeFilter])

  const getTypeLabel = (type) => {
    switch (type) {
      case 'sale': return { label: 'بيع', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: ArrowDownCircle };
      case 'purchase': return { label: 'شراء (إكسيل)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: ArrowUpCircle };
      case 'stock_in': return { label: 'زيادة يدوية', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', icon: ArrowUpCircle };
      case 'stock_out': return { label: 'صرف يدوي', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: ArrowDownCircle };
      case 'return_deleted_invoice': return { label: 'مرتجع حذف', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: History };
      default: return { label: type, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: Info };
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-primary-500/5">
                <History size={22} className="text-primary-400" />
            </div>
            سجل تتبع المخزن
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">تاريخ كافة الحركات الصادرة والواردة</p>
        </div>
      </div>

      {/* Filters Overlay */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
            <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="ابحث بالاسم، الملاحظة، الكود..." 
                className="input pr-12 text-sm" 
            />
        </div>
        <div className="relative group min-w-[240px]">
            <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select 
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value)} 
                className="input pr-12 text-xs font-black uppercase tracking-widest"
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

      {/* Modern Log Display */}
      <div className="card !p-0 border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-6 gap-4 p-8 border-b border-white/5 bg-white/[0.01] text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
          <div className="col-span-3">القطعة والبيانات</div>
          <div>النوع</div>
          <div className="text-center">الكمية</div>
          <div className="text-left">الوقت</div>
        </div>

        {loading ? (
             <div className="py-32 text-center">
                <div className="w-12 h-12 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-neon" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-50">جاري مسامحة السجلات المباشرة...</p>
             </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-32 text-center opacity-30">
            <Package size={64} className="text-slate-700 mx-auto mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-widest">لا توجد سجلات مطابقة لهذا البحث</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-white/5">
            {filteredLogs.map(log => {
              const info = getTypeLabel(log.type);
              const Icon = info.icon;
              const date = log.createdAt?.toDate?.() || new Date(log.createdAt?.seconds * 1000) || new Date();
              
              return (
                <motion.div variants={itemVariant} key={log.id} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-8 items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="lg:col-span-3 flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-premium ${info.bg}`}>
                      <Icon size={24} className={info.color} />
                    </div>
                    <div className="min-w-0 md:text-right text-right">
                      <p className="text-white font-black text-lg tracking-tight font-display mb-1 leading-tight">{log.productName}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate opacity-60 tracking-tight">{log.note || 'ملاحظات: حركة مخزنية روتينية'}</p>
                    </div>
                  </div>
                  
                  <div className="lg:block">
                     <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-tighter ${info.bg} ${info.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${info.color.replace('text-', 'bg-')}`} />
                        {info.label}
                     </span>
                  </div>

                  <div className="text-center bg-obsidian-950/50 py-3 rounded-2xl border border-white/5">
                    <p className={`text-lg font-black font-display tracking-tighter ${log.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.delta > 0 ? '+' : ''}{log.delta} <span className="text-[10px] font-normal opacity-50">قطعة</span>
                    </p>
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">الرصيد: {log.newQty}</p>
                  </div>

                  <div className="flex flex-col lg:items-end justify-center gap-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-200 font-black font-display leading-none">
                        <Calendar size={12} className="text-primary-400/50" />
                        <span>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black leading-none mt-1">
                        <Clock size={12} className="opacity-30" />
                        <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
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
