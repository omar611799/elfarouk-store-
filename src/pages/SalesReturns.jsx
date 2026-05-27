import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, Search, CheckCircle2, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SalesReturns() {
  const { invoices, returnInvoiceItems } = useStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [returnQtys, setReturnQtys] = useState({}) // { itemId: qty }
  const [saving, setSaving] = useState(false)

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices.slice(0, 20)
    const q = searchQuery.toLowerCase()
    return invoices.filter(inv =>
      String(inv.number).includes(q) ||
      inv.customerData?.name?.toLowerCase().includes(q) ||
      inv.customerData?.phone?.includes(q)
    ).slice(0, 20)
  }, [invoices, searchQuery])

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv)
    const qtys = {}
    ;(inv.items || []).forEach(item => { qtys[item.id] = 0 })
    setReturnQtys(qtys)
  }

  const getAvailableToReturn = (item) => {
    return Math.max(0, item.qty - (item.returnedQty || 0))
  }

  const updateReturnQty = (itemId, val, max) => {
    setReturnQtys(prev => ({ ...prev, [itemId]: Math.max(0, Math.min(Number(val), max)) }))
  }

  const refundTotal = useMemo(() => {
    if (!selectedInvoice) return 0
    return (selectedInvoice.items || []).reduce((sum, item) => {
      const qty = returnQtys[item.id] || 0
      return sum + qty * (item.price || 0)
    }, 0)
  }, [selectedInvoice, returnQtys])

  const handleSubmit = async () => {
    const itemsToReturn = (selectedInvoice.items || [])
      .filter(item => (returnQtys[item.id] || 0) > 0)
      .map(item => ({ id: item.id, qty: returnQtys[item.id] }))

    if (itemsToReturn.length === 0) return toast.error('لم تحدد أي كميات للإرجاع')

    setSaving(true)
    try {
      await returnInvoiceItems({ invoiceId: selectedInvoice.id, itemsToReturn })
      setSelectedInvoice(null)
      setReturnQtys({})
      setSearchQuery('')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <RefreshCcw size={20} className="text-rose-400" />
            </div>
            مرتجعات المبيعات
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
            استرداد أصناف من الفواتير المباعة وتسوية المبالغ
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-4 top-3.5 text-slate-500" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم العميل أو الهاتف..."
          className="input w-full pr-10 text-sm"
        />
      </div>

      {/* Invoice List */}
      {!selectedInvoice && (
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="card border-dashed border-white/5 text-center py-16 opacity-40">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا توجد فواتير مطابقة</p>
            </div>
          ) : (
            filteredInvoices.map(inv => {
              const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0)
              const hasReturns = (inv.items || []).some(it => it.returnedQty > 0)
              return (
                <button
                  key={inv.id}
                  onClick={() => handleSelectInvoice(inv)}
                  className="card !p-4 w-full text-right hover:border-rose-500/30 hover:bg-rose-500/[0.02] transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-slate-400" />
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-sm">فاتورة #{inv.number}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{inv.customerData?.name || 'نقدي'} • {date.toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {hasReturns && (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                          مرتجع جزئي
                        </span>
                      )}
                      <div className="text-right">
                        <p className="font-black text-white text-sm">{Number(inv.total || 0).toLocaleString()} <span className="text-[9px] text-slate-500">ج.م</span></p>
                        <p className={`text-[9px] font-black ${inv.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {inv.paymentStatus === 'paid' ? 'مدفوع' : `آجل: ${Number(inv.dueAmount || 0).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Return Panel */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Invoice Summary */}
            <div className="card !p-4 border-rose-500/20 bg-rose-500/[0.02]">
              <div className="flex items-center justify-between">
                <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-colors">
                  <X size={16} />
                </button>
                <div className="text-right">
                  <p className="font-black text-white text-base">فاتورة #{selectedInvoice.number}</p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {selectedInvoice.customerData?.name} • {selectedInvoice.customerData?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="card !p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <RefreshCcw size={16} className="text-rose-400" />
                  حدد الكميات المُرجَعة
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {(selectedInvoice.items || []).map(item => {
                  const available = getAvailableToReturn(item)
                  const currentQty = returnQtys[item.id] || 0
                  return (
                    <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${available === 0 ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 font-bold">
                            الكمية الأصلية: {item.qty}
                          </p>
                          {item.returnedQty > 0 && (
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              تم إرجاع: {item.returnedQty}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500">
                            متاح للإرجاع: <strong className="text-white">{available}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          disabled={available === 0}
                          onClick={() => updateReturnQty(item.id, currentQty - 1, available)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                        >−</button>
                        <input
                          type="number"
                          value={currentQty}
                          min={0}
                          max={available}
                          disabled={available === 0}
                          onChange={e => updateReturnQty(item.id, e.target.value, available)}
                          className="w-12 text-center bg-transparent border-b border-white/20 focus:border-rose-500 outline-none font-black text-white text-sm pb-1 disabled:opacity-30"
                        />
                        <button
                          disabled={available === 0 || currentQty >= available}
                          onClick={() => updateReturnQty(item.id, currentQty + 1, available)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                        >+</button>
                        <span className={`text-[10px] font-black w-24 text-left ${currentQty > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                          {currentQty > 0 ? `=${(item.price * currentQty).toLocaleString()} ج` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Refund Summary */}
            <AnimatePresence>
              {refundTotal > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="card !p-5 border-rose-500/20 bg-rose-500/[0.03] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي قيمة المرتجع</span>
                    <span className="text-2xl font-black text-rose-400 font-display">
                      {refundTotal.toLocaleString()} <small className="text-xs font-normal opacity-60">ج.م</small>
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-bold space-y-1 border-t border-white/5 pt-3">
                    <p>• إذا كانت هناك مديونية على الفاتورة، سيتم خصم الإرجاع منها أولاً.</p>
                    <p>• إذا تم سداد الفاتورة بالكامل، سيتم استرداد المبلغ نقداً.</p>
                    <p>• سيتم إعادة الكميات المُرجَعة للمخزون تلقائياً.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setSelectedInvoice(null)}
                className="btn-ghost !px-6 !py-3 text-[10px] font-black uppercase tracking-widest"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={refundTotal === 0 || saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3 text-[10px] font-black uppercase tracking-widest !bg-rose-500 hover:!bg-rose-600 shadow-rose-500/20 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {saving ? 'جاري المعالجة...' : 'تأكيد الإرجاع وتسوية المبالغ'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
