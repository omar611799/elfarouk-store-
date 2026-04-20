import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, MessageCircle, Search, Trash2, AlertTriangle,
  CornerUpLeft, Plus, Minus, ChevronDown, CheckCircle2,
  Clock, XCircle, Eye, Filter, Download, TrendingUp
} from 'lucide-react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

const STATUS_MAP = {
  paid:    { label: 'مدفوعة',     bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  partial: { label: 'جزئية',      bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock },
  unpaid:  { label: 'غير مدفوعة', bg: 'bg-rose-100',    text: 'text-rose-700',    icon: XCircle },
}

export default function Invoices() {
  const { invoices, deleteInvoice, returnInvoiceItems } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [returnMode, setReturnMode] = useState(null)
  const [isReturning, setIsReturning] = useState(false)
  const [returnQtys, setReturnQtys] = useState({})

  const filtered = useMemo(() => {
    return invoices.filter(i => {
      const matchSearch = !search ||
        i.customerData?.name?.includes(search) ||
        String(i.number)?.includes(search)
      const matchStatus = !statusFilter || i.paymentStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [invoices, search, statusFilter])

  // Summary stats
  const totalRevenue = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const paidCount = invoices.filter(i => i.paymentStatus === 'paid').length
  const pendingCount = invoices.filter(i => i.paymentStatus !== 'paid').length

  const sendWhatsApp = (inv) => {
    const items = inv.items?.map(i => {
      let line = `- ${i.name} × ${i.qty}`
      if (i.returnedQty > 0) line += ` (مرتجع ${i.returnedQty})`
      return line + ` = ${(i.price * i.qty).toLocaleString('en-US')} ج.م`
    }).join('\n') || ''

    const msg = `🧾 فاتورة من الفاروق ستور\n` +
      `رقم: ${inv.number}\nالعميل: ${inv.customerData?.name}\n` +
      `${inv.customerData?.carModel ? `العربية: ${inv.customerData.carModel}\n` : ''}` +
      `\nالمنتجات:\n${items}\n\n` +
      `الإجمالي: ${inv.total?.toLocaleString('en-US')} ج.م\n` +
      `${inv.dueAmount > 0 ? `المتبقي: ${inv.dueAmount?.toLocaleString('en-US')} ج.م\n` : '✅ مدفوع بالكامل\n'}` +
      `شكراً لتعاملكم معنا 🙏`
    const phone = inv.customerData?.phone?.replace(/^0/, '20') || WHATSAPP
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleReturnQtyChange = (itemId, delta, maxAvailable) => {
    setReturnQtys(prev => {
      const current = prev[itemId] || 0
      let next = Math.max(0, Math.min(maxAvailable, current + delta))
      return { ...prev, [itemId]: next }
    })
  }

  const submitPartialReturn = async (inv) => {
    const itemsToReturn = Object.entries(returnQtys)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, qty }))
    if (itemsToReturn.length === 0) return
    setIsReturning(true)
    try {
      await returnInvoiceItems({ invoiceId: inv.id, itemsToReturn })
      setReturnMode(null)
      setReturnQtys({})
    } finally {
      setIsReturning(false)
    }
  }

  const getStatus = (inv) => STATUS_MAP[inv.paymentStatus] || STATUS_MAP.unpaid

  return (
    <div className="space-y-7 pb-20">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
              <FileText size={20} className="text-orange-600" />
            </span>
            الفواتير والمرتجعات
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 mr-13">إجمالي العمليات: <span className="text-orange-500 font-black">{invoices.length}</span></p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-xs">
          <Download size={15} /> تصدير
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="إجمالي الإيرادات" value={`${Math.round(totalRevenue).toLocaleString()} ج.م`} color="orange" icon={TrendingUp} />
        <SummaryCard label="فواتير مكتملة" value={paidCount} color="emerald" icon={CheckCircle2} />
        <SummaryCard label="فواتير معلقة" value={pendingCount} color="rose" icon={Clock} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الفاتورة..." className="input pr-11 !rounded-2xl" />
        </div>
        <div className="relative sm:w-48">
          <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="input pr-10 !rounded-2xl appearance-none text-sm">
            <option value="">كل الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="partial">جزئية</option>
            <option value="unpaid">غير مدفوعة</option>
          </select>
        </div>
      </div>

      {/* ── Invoices List ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((inv, idx) => {
            const isSelected = selected?.id === inv.id
            const isReturningMode = returnMode === inv.id
            const isDeletingMode = deleteConfirm === inv.id
            const st = getStatus(inv)
            const StatusIcon = st.icon

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.03 }}
                className={`card !p-0 overflow-hidden cursor-pointer transition-all duration-300
                  ${isSelected ? 'border-orange-300 shadow-lg shadow-orange-500/10' : 'hover:border-slate-300 hover:shadow-md'}`}
                onClick={() => {
                  if (isReturningMode || isDeletingMode) return
                  setSelected(isSelected ? null : inv)
                }}
              >
                {/* Invoice Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${st.bg}`}>
                    <StatusIcon size={18} className={st.text} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{inv.customerData?.name || 'عميل نقدي'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-bold">فاتورة #{inv.number}</span>
                      {inv.customerData?.carModel && (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{inv.customerData.carModel}</span>
                      )}
                    </div>
                  </div>

                  {/* Amount + Status */}
                  <div className="text-left shrink-0">
                    <p className="font-black text-slate-800 text-base">{Number(inv.total || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-400 font-normal">ج.م</span></p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                  </div>

                  {/* Expand Arrow */}
                  <ChevronDown size={16} className={`text-slate-300 transition-transform shrink-0 ${isSelected ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded Detail Panel */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-slate-100"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="px-5 py-5 space-y-4">

                        {/* Items Table */}
                        <div className="bg-slate-50 rounded-2xl overflow-hidden">
                          <div className="grid grid-cols-3 text-[9px] font-black text-slate-400 uppercase px-4 py-2 border-b border-slate-100">
                            <span>المنتج</span>
                            <span className="text-center">الكمية</span>
                            <span className="text-left">الإجمالي</span>
                          </div>
                          {inv.items?.map((it, i) => (
                            <div key={i} className="grid grid-cols-3 items-center px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-100 transition-colors">
                              <div>
                                <p className="text-xs font-black text-slate-700">{it.name}</p>
                                {it.returnedQty > 0 && <span className="text-[9px] text-rose-500 font-bold">مرتجع: {it.returnedQty}</span>}
                              </div>
                              <p className="text-xs font-bold text-slate-500 text-center">×{it.qty}</p>
                              <p className="text-xs font-black text-slate-700 text-left">{(it.price * it.qty).toLocaleString('en-US')} ج</p>
                            </div>
                          ))}
                        </div>

                        {/* Due Amount Warning */}
                        {inv.dueAmount > 0 && (
                          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-2xl">
                            <AlertTriangle size={15} className="shrink-0" />
                            <p className="text-xs font-black">المتبقي: {Number(inv.dueAmount).toLocaleString('en-US')} ج.م</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isReturningMode && !isDeletingMode && (
                          <div className="flex gap-2">
                            <button onClick={() => sendWhatsApp(inv)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all">
                              <MessageCircle size={14} /> واتساب
                            </button>
                            <button onClick={() => window.open(`/receipt/${inv.id}`, '_blank')}
                              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all border border-blue-200">
                              <Eye size={14} /> إيصال
                            </button>
                            <button onClick={() => { setReturnMode(inv.id); setReturnQtys({}) }}
                              className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all border border-amber-200">
                              <CornerUpLeft size={14} /> مرتجع
                            </button>
                            <button onClick={() => setDeleteConfirm(inv.id)}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all border border-rose-200">
                              <Trash2 size={14} /> حذف
                            </button>
                          </div>
                        )}

                        {/* Return Panel */}
                        {isReturningMode && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                            <p className="text-xs font-black text-amber-700 flex items-center gap-2">
                              <CornerUpLeft size={14} /> مرتجع جزئي
                            </p>
                            {inv.items?.map(it => {
                              const available = it.qty - (it.returnedQty || 0)
                              if (available <= 0) return null
                              const val = returnQtys[it.id] || 0
                              return (
                                <div key={it.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                                  <p className="text-xs font-black text-slate-700 flex-1">{it.name} <span className="text-slate-400 font-normal">({available} متاح)</span></p>
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => handleReturnQtyChange(it.id, -1, available)}
                                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                                      <Minus size={12} />
                                    </button>
                                    <span className="w-5 text-center font-black text-amber-600 text-sm">{val}</span>
                                    <button onClick={() => handleReturnQtyChange(it.id, 1, available)}
                                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors">
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => submitPartialReturn(inv)}
                                disabled={isReturning || Object.values(returnQtys).every(q => q === 0)}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-black transition-all">
                                {isReturning ? 'جاري...' : 'تأكيد المرتجع'}
                              </button>
                              <button onClick={() => setReturnMode(null)}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-black transition-all hover:bg-slate-50">
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Delete Confirm */}
                        {isDeletingMode && (
                          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                            <p className="text-xs font-black text-rose-700 flex items-center gap-2">
                              <AlertTriangle size={14} /> هل تريد حذف الفاتورة واسترداد البضاعة؟
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setIsDeleting(true)
                                  try {
                                    await deleteInvoice(inv.id)
                                    setDeleteConfirm(null)
                                    setSelected(null)
                                  } finally { setIsDeleting(false) }
                                }}
                                disabled={isDeleting}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40">
                                {isDeleting ? 'جاري...' : 'تأكيد الحذف'}
                              </button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50">
                                تراجع
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="card text-center py-20 border-dashed">
            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-bold">لا توجد فواتير</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon: Icon }) {
  const palette = {
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  val: 'text-orange-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', val: 'text-emerald-700' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    val: 'text-rose-700' },
  }
  const p = palette[color]
  return (
    <div className={`card flex items-center gap-4 !p-5 ${p.bg} border-0`}>
      <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm ${p.text}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className={`text-2xl font-black ${p.val}`}>{value}</p>
      </div>
    </div>
  )
}
