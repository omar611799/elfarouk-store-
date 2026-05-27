import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, RotateCcw, Search, CheckCircle2, Trash2, PackageX, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierReturns() {
  const { suppliers, purchases, products, supplierReturns, recordSupplierReturn } = useStore()

  const [step, setStep] = useState(1) // 1=اختيار المورد, 2=اختيار الفاتورة, 3=الكميات
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [returnItems, setReturnItems] = useState([]) // { id, name, qty, cost, maxQty }
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers
    return suppliers.filter(s => s.name?.toLowerCase().includes(supplierSearch.toLowerCase()))
  }, [suppliers, supplierSearch])

  const supplierPurchases = useMemo(() => {
    if (!selectedSupplierId) return []
    return purchases.filter(p => p.supplierId === selectedSupplierId)
  }, [purchases, selectedSupplierId])

  const selectedPurchase = useMemo(() => {
    return purchases.find(p => p.id === selectedPurchaseId)
  }, [purchases, selectedPurchaseId])

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((sum, i) => sum + (Number(i.cost) * i.qty), 0)
  }, [returnItems])

  const handleSelectSupplier = (id) => {
    setSelectedSupplierId(id)
    setSelectedPurchaseId('')
    setReturnItems([])
    setStep(2)
  }

  const handleSelectPurchase = (purchase) => {
    setSelectedPurchaseId(purchase.id)
    // Build return items from purchase, capped at current stock
    const items = (purchase.items || []).map(item => {
      const product = products.find(p => p.id === item.id)
      const available = product?.quantity || 0
      return {
        id: item.id,
        name: item.name,
        cost: item.cost || 0,
        qty: 0,
        maxQty: Math.min(item.qty, available),
        availableInStock: available,
      }
    })
    setReturnItems(items)
    setStep(3)
  }

  const updateQty = (id, val) => {
    setReturnItems(prev => prev.map(i =>
      i.id === id ? { ...i, qty: Math.max(0, Math.min(Number(val), i.maxQty)) } : i
    ))
  }

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.qty > 0)
    if (itemsToReturn.length === 0) return toast.error('لم تحدد أي كميات للإرجاع')
    if (!selectedSupplierId) return toast.error('يرجى اختيار المورد')

    setSaving(true)
    try {
      await recordSupplierReturn({
        supplierId: selectedSupplierId,
        purchaseId: selectedPurchaseId,
        items: itemsToReturn,
        totalValue: totalReturnValue,
        note,
      })
      // Reset
      setStep(1)
      setSelectedSupplierId('')
      setSelectedPurchaseId('')
      setReturnItems([])
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <RotateCcw size={20} className="text-orange-400" />
            </div>
            مرتجعات الموردين
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
            إرجاع بضاعة غير مطابقة أو تالفة للمورد
          </p>
        </div>
        {/* Stats */}
        <div className="card !py-2 !px-4 border-orange-500/10 bg-orange-500/[0.02]">
          <p className="text-slate-600 text-[7px] font-black uppercase tracking-widest leading-none mb-1">إجمالي المرتجعات</p>
          <p className="text-base font-black text-orange-400 font-display">
            {supplierReturns.length} <span className="text-[9px] font-normal opacity-50">عملية</span>
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 px-1">
        {['اختيار المورد', 'الفاتورة', 'الكميات'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
              step === idx + 1
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : step > idx + 1
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-slate-600 border border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                step > idx + 1 ? 'bg-emerald-500 text-white' : step === idx + 1 ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-500'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </span>
              {label}
            </div>
            {idx < 2 && <div className={`h-px flex-1 w-6 ${step > idx + 1 ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: اختيار المورد */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute right-4 top-3.5 text-slate-500" />
            <input
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              placeholder="ابحث عن مورد..."
              className="input w-full pr-10 text-sm"
            />
          </div>
          {filteredSuppliers.length === 0 ? (
            <div className="card border-dashed border-white/5 text-center py-16 opacity-40">
              <Truck size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا يوجد موردون</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSuppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSupplier(s.id)}
                  className="card !p-4 text-right hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Truck size={20} className="text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white text-base truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">{s.phone || 'بدون رقم'}</p>
                    </div>
                    {s.debtTotal > 0 && (
                      <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg shrink-0">
                        مديونية: {Number(s.debtTotal).toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 2: اختيار الفاتورة */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost !px-3 !py-2 text-[10px] font-black">
              ← رجوع
            </button>
            <div className="card !py-2 !px-4 border-orange-500/10 bg-orange-500/[0.02]">
              <p className="text-[10px] text-orange-300 font-black">{selectedSupplier?.name}</p>
            </div>
          </div>

          <h2 className="font-black text-white text-base flex items-center gap-2 px-1">
            <FileText size={16} className="text-orange-400" />
            اختر فاتورة الشراء
          </h2>

          {supplierPurchases.length === 0 ? (
            <div className="card border-dashed border-white/5 text-center py-16 opacity-40">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا توجد فواتير شراء لهذا المورد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supplierPurchases.map(p => {
                const date = p.createdAt?.toDate?.() || new Date(p.createdAt || 0)
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPurchase(p)}
                    className="card !p-4 w-full text-right hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <FileText size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">فاتورة رقم: {p.billNumber || '—'}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{date.toLocaleDateString('en-GB')} • {(p.items || []).length} أصناف</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-sm">{Number(p.total || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-500">ج.م</span></p>
                        {p.dueAmount > 0 && <p className="text-[9px] text-amber-400 font-black">متبقي: {Number(p.dueAmount).toLocaleString()}</p>}
                      </div>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => handleSelectPurchase({ id: '', items: products.slice(0, 20).map(p => ({ id: p.id, name: p.name, qty: 999, cost: p.cost || 0 })) })}
                className="card !p-4 w-full text-right border-dashed hover:border-orange-500/30 transition-all"
              >
                <p className="text-slate-500 font-black text-sm text-center">+ مرتجع بدون فاتورة محددة</p>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: تحديد الكميات */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="btn-ghost !px-3 !py-2 text-[10px] font-black">
              ← رجوع
            </button>
            <div className="card !py-2 !px-4 border-orange-500/10 bg-orange-500/[0.02] flex items-center gap-2">
              <span className="text-[10px] text-orange-300 font-black">{selectedSupplier?.name}</span>
              {selectedPurchase?.billNumber && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-slate-400 font-bold">فاتورة: {selectedPurchase.billNumber}</span>
                </>
              )}
            </div>
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <PackageX size={16} className="text-orange-400" />
                حدد الكميات المُرجَعة
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {returnItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      متاح في المخزن: {item.availableInStock} • تكلفة الوحدة: {Number(item.cost).toLocaleString()} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >−</button>
                    <input
                      type="number"
                      value={item.qty}
                      min={0}
                      max={item.maxQty}
                      onChange={e => updateQty(item.id, e.target.value)}
                      className="w-14 text-center bg-transparent border-b border-white/20 focus:border-orange-500 outline-none font-black text-white text-sm pb-1"
                    />
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >+</button>
                    <span className={`text-[10px] font-black w-24 text-left ${item.qty > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                      {item.qty > 0 ? `=${(item.cost * item.qty).toLocaleString()} ج` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="card !p-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ملاحظة (اختياري)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="سبب الإرجاع، مثل: منتج تالف، غير مطابق للمواصفات..."
              className="input w-full text-sm"
            />
          </div>

          {/* Total */}
          <AnimatePresence>
            {totalReturnValue > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card !p-4 border-orange-500/20 bg-orange-500/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي قيمة المرتجع</span>
                  <span className="text-xl font-black text-orange-400 font-display">
                    {totalReturnValue.toLocaleString()} <small className="text-xs font-normal opacity-60">ج.م</small>
                  </span>
                </div>
                <p className="text-[9px] text-slate-600 font-bold mt-2">
                  * سيتم خصم هذا المبلغ من مديونية المورد وتحديث المخزون تلقائياً
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setSelectedSupplierId(''); setSelectedPurchaseId(''); setReturnItems([]) }}
              className="btn-ghost !px-6 !py-3 text-[10px] font-black uppercase tracking-widest"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalReturnValue === 0 || saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3 text-[10px] font-black uppercase tracking-widest !bg-orange-500 hover:!bg-orange-600 shadow-orange-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {saving ? 'جاري الحفظ...' : 'تأكيد الإرجاع وتحديث المخزون'}
            </button>
          </div>
        </motion.div>
      )}

      {/* History */}
      {supplierReturns.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="font-black text-white text-base flex items-center gap-2 px-1 uppercase tracking-tight font-display">
            <RotateCcw size={16} className="text-orange-400" />
            سجل المرتجعات ({supplierReturns.length})
          </h2>
          <div className="space-y-3">
            {supplierReturns.map(ret => {
              const supplier = suppliers.find(s => s.id === ret.supplierId)
              const date = ret.createdAt?.toDate?.() || new Date(ret.createdAt || 0)
              return (
                <div key={ret.id} className="card !p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <RotateCcw size={16} className="text-orange-400" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">{supplier?.name || 'مورد محذوف'}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {date.toLocaleDateString('en-GB')} • {(ret.items || []).length} أصناف
                        </p>
                        {ret.note && <p className="text-[10px] text-slate-400 mt-1 italic">{ret.note}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-orange-400 text-base">{Number(ret.totalValue || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-500">ج.م</span></p>
                      {ret.cashierName && <p className="text-[9px] text-slate-600 font-bold">{ret.cashierName}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
