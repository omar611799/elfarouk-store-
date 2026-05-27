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

  const updateQty = (itemId, newQty) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const val = Number(newQty)
      if (Number.isNaN(val) || val < 0) return { ...item, qty: 0 }
      // cannot return more than what was purchased, nor more than what is currently in stock
      const maxReturnable = Math.min(item.maxQty, item.availableInStock)
      return { ...item, qty: Math.min(maxReturnable, val) }
    }))
  }
  const handleSubmit = async () => {
    const finalItems = returnItems.filter(i => i.qty > 0).map(i => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      cost: i.cost
    }))
    if (finalItems.length === 0) return toast.error('يرجى تحديد كميات للمرتجع أولاً')
    
    setSaving(true)
    try {
      await recordSupplierReturn({
        supplierId: selectedSupplierId,
        purchaseId: selectedPurchase?.id || '',
        items: finalItems,
        totalValue: totalReturnValue,
        note
      })
      toast.success('تم تسجيل مرتجع المورد وتحديث الحسابات بنجاح')
      setStep(1)
      setSelectedSupplierId('')
      setSelectedPurchase(null)
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
              <RotateCcw size={20} className="text-orange-500" />
            </span>
            مرتجعات الموردين
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 mr-13">
            إرجاع بضاعة غير مطابقة أو تالفة للمورد وتخفيض حسابه
          </p>
        </div>
        {/* Stats */}
        <div className="card !py-2 !px-4 border-orange-200 bg-orange-50/30">
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-none mb-1">إجمالي المرتجعات</p>
          <p className="text-base font-black text-orange-600 font-display">
            {supplierReturns.length} <span className="text-[10px] font-normal text-slate-400">عملية</span>
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 px-1">
        {['اختيار المورد', 'الفاتورة', 'الكميات'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
              step === idx + 1
                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                : step > idx + 1
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                step > idx + 1 ? 'bg-emerald-500 text-white' : step === idx + 1 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </span>
              {label}
            </div>
            {idx < 2 && <div className={`h-px flex-1 w-6 ${step > idx + 1 ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: اختيار المورد */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative group">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              placeholder="ابحث عن مورد للمرتجع..."
              className="input w-full pr-11 text-sm !rounded-2xl"
            />
          </div>
          {filteredSuppliers.length === 0 ? (
            <div className="card border-dashed border-slate-200 text-center py-20">
              <Truck size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">لا يوجد موردون يطابقون البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSuppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSupplier(s.id)}
                  className="card !p-4 text-right hover:border-orange-200 hover:bg-orange-50/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Truck size={20} className="text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 text-base truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">{s.phone || 'بدون رقم'}</p>
                    </div>
                    {s.debtTotal > 0 && (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg shrink-0">
                        حساب: {Number(s.debtTotal).toLocaleString()}
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
            <div className="card !py-2 !px-4 border-orange-100 bg-orange-50/20">
              <p className="text-[10px] text-orange-600 font-black">{selectedSupplier?.name}</p>
            </div>
          </div>

          <h2 className="font-black text-slate-800 text-base flex items-center gap-2 px-1">
            <FileText size={16} className="text-orange-500" />
            اختر فاتورة الشراء المراد الإرجاع منها:
          </h2>

          {supplierPurchases.length === 0 ? (
            <div className="card border-dashed border-slate-200 text-center py-20">
              <FileText size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">لا توجد فواتير شراء سابقة لهذا المورد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supplierPurchases.map(p => {
                const date = p.createdAt?.toDate?.() || new Date(p.createdAt || 0)
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPurchase(p)}
                    className="card !p-4 w-full text-right hover:border-orange-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <FileText size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">فاتورة رقم: {p.billNumber || '—'}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">{date.toLocaleDateString('en-GB')} • {(p.items || []).length} أصناف</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-slate-800 text-sm">{Number(p.total || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">ج.م</span></p>
                        {p.dueAmount > 0 && <p className="text-[9px] text-amber-600 font-black mt-0.5">متبقي: {Number(p.dueAmount).toLocaleString()}</p>}
                      </div>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => handleSelectPurchase({ id: '', items: products.slice(0, 20).map(p => ({ id: p.id, name: p.name, qty: 999, cost: p.cost || 0 })) })}
                className="card !p-4 w-full text-right border-dashed hover:border-orange-200 transition-all"
              >
                <p className="text-slate-500 font-black text-sm text-center">+ إرجاع حر (بدون فاتورة محددة)</p>
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
            <div className="card !py-2 !px-4 border-orange-100 bg-orange-50/20 flex items-center gap-2">
              <span className="text-[10px] text-orange-600 font-black">{selectedSupplier?.name}</span>
              {selectedPurchase?.billNumber && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400 font-bold">فاتورة: {selectedPurchase.billNumber}</span>
                </>
              )}
            </div>
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <PackageX size={16} className="text-orange-500" />
                حدد الكميات المرجعة من الأصناف:
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {returnItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      متاح حالياً بالمخزن: {item.availableInStock} • تكلفة الشراء للوحدة: {Number(item.cost).toLocaleString()} ج
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors font-bold"
                    >−</button>
                    <input
                      type="number"
                      value={item.qty}
                      min={0}
                      max={item.maxQty}
                      onChange={e => updateQty(item.id, e.target.value)}
                      className="w-14 text-center bg-transparent border-b border-slate-200 focus:border-orange-500 outline-none font-black text-slate-800 text-sm pb-1"
                    />
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors font-bold"
                    >+</button>
                    <span className={`text-[10px] font-black w-24 text-left ${item.qty > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                      {item.qty > 0 ? `=${(item.cost * item.qty).toLocaleString()} ج` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="card !p-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ملاحظة أو سبب المرتجع</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="مثال: قطعة غير مطابقة، تالفة أثناء الشحن، زيادة كميات..."
              className="input w-full text-sm !rounded-xl"
            />
          </div>

          {/* Total */}
          <AnimatePresence>
            {totalReturnValue > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card !p-4 border-orange-200 bg-orange-50/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي قيمة المرتجع المستردة</span>
                  <span className="text-xl font-black text-orange-600 font-display">
                    {totalReturnValue.toLocaleString()} <small className="text-xs font-normal">ج.م</small>
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-2">
                  * سيتم تلقائياً خصم القيمة من حساب هذا المورد وتعديل عدد القطع في المخزن.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setSelectedSupplierId(''); setSelectedPurchase(null); setReturnItems([]) }}
              className="btn-ghost !px-6 !py-3 text-[10px] font-black uppercase tracking-widest !rounded-xl"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalReturnValue === 0 || saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3 text-[10px] font-black uppercase tracking-widest !bg-orange-500 hover:!bg-orange-600 shadow-lg shadow-orange-500/25 !rounded-xl disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {saving ? 'جاري الحفظ...' : 'تأكيد المرتجع وتعديل المخزن والمديونية'}
            </button>
          </div>
        </motion.div>
      )}

      {/* History */}
      {supplierReturns.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="font-black text-slate-800 text-base flex items-center gap-2 px-1">
            <RotateCcw size={16} className="text-orange-500" />
            سجل المرتجعات النشطة ({supplierReturns.length})
          </h2>
          <div className="space-y-3">
            {supplierReturns.map(ret => {
              const supplier = suppliers.find(s => s.id === ret.supplierId)
              const date = ret.createdAt?.toDate?.() || new Date(ret.createdAt || 0)
              return (
                <div key={ret.id} className="card !p-4 hover:border-slate-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                        <RotateCcw size={16} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{supplier?.name || 'مورد محذوف'}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {date.toLocaleDateString('en-GB')} • {(ret.items || []).length} أصناف مرتجعة
                        </p>
                        {ret.note && <p className="text-[10px] text-slate-500 mt-1 italic font-bold">السبب: {ret.note}</p>}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-black text-orange-600 text-base">{Number(ret.totalValue || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">ج.م</span></p>
                      {ret.cashierName && <p className="text-[9px] text-slate-400 font-bold mt-1">{ret.cashierName}</p>}
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
