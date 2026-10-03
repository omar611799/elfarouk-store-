import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, RotateCcw, Search, CheckCircle2, PackageX, FileText, 
  Printer, Send, Download, X, AlertTriangle, ChevronRight,
  DollarSign, Calendar, Eye, ShieldCheck, Sparkles
} from 'lucide-react'
import { formatPhoneForWhatsApp } from '../utils/phone'
import toast from 'react-hot-toast'

const RETURN_REASONS = [
  'عيب صناعة / تلف خامة',
  'صنف غير مطابق للمواصفات أو الكود',
  'كمية زائدة بالخطأ عن الفاتورة',
  'مرتجع بطلب المورد (استبدال)',
  'تلف أثناء الشحن والتفريغ',
  'أخرى'
]

export default function SupplierReturns() {
  const { suppliers, purchases, products, supplierReturns = [], recordSupplierReturn } = useStore()

  const [step, setStep] = useState(1) // 1=اختيار المورد, 2=اختيار الفاتورة, 3=الكميات
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [returnItems, setReturnItems] = useState([]) // { id, name, qty, cost, maxQty, availableInStock }
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [historySearch, setHistorySearch] = useState('')

  // Debit note modal state
  const [debitNoteModal, setDebitNoteModal] = useState(null)

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers
    const q = supplierSearch.toLowerCase()
    return suppliers.filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q))
  }, [suppliers, supplierSearch])

  const supplierPurchases = useMemo(() => {
    if (!selectedSupplierId) return []
    return purchases.filter(p => p.supplierId === selectedSupplierId)
  }, [purchases, selectedSupplierId])

  const selectedPurchase = useMemo(() => {
    return purchases.find(p => p.id === selectedPurchaseId)
  }, [purchases, selectedPurchaseId])

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((sum, i) => sum + (Number(i.cost || 0) * (Number(i.qty) || 0)), 0)
  }, [returnItems])

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId)
  }, [suppliers, selectedSupplierId])

  const handleSelectSupplier = (id) => {
    setSelectedSupplierId(id)
    setSelectedPurchaseId('')
    setReturnItems([])
    setStep(2)
  }

  const handleSelectPurchase = (purchase) => {
    setSelectedPurchaseId(purchase.id || '')
    // Build return items from purchase, capped at current stock
    const items = (purchase.items || []).map(item => {
      const product = products.find(p => p.id === item.id)
      const available = Number(product?.quantity || 0)
      return {
        id: item.id,
        name: item.name,
        cost: Number(item.cost || product?.cost || 0),
        qty: 0,
        maxQty: Math.min(Number(item.qty || 999), available),
        availableInStock: available,
      }
    })
    setReturnItems(items)
    setStep(3)
  }

  const handleCustomProductsReturn = () => {
    setSelectedPurchaseId('')
    const items = products.filter(p => Number(p.quantity || 0) > 0).slice(0, 50).map(p => ({
      id: p.id,
      name: p.name,
      cost: Number(p.cost || 0),
      qty: 0,
      maxQty: Number(p.quantity || 0),
      availableInStock: Number(p.quantity || 0),
    }))
    setReturnItems(items)
    setStep(3)
  }

  const updateQty = (itemId, newQty) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const val = Number(newQty)
      if (Number.isNaN(val) || val < 0) return { ...item, qty: 0 }
      const maxReturnable = Math.min(item.maxQty, item.availableInStock)
      return { ...item, qty: Math.min(maxReturnable, val) }
    }))
  }

  const handleSubmit = async () => {
    const finalItems = returnItems.filter(i => (Number(i.qty) || 0) > 0).map(i => ({
      id: i.id,
      name: i.name,
      qty: Number(i.qty),
      cost: Number(i.cost)
    }))
    if (finalItems.length === 0) return toast.error('يرجى تحديد كميات للمرتجع أولاً')
    
    setSaving(true)
    try {
      const fullReason = selectedReason === 'أخرى' && note ? note : `${selectedReason}${note ? ' - ' + note : ''}`
      const result = await recordSupplierReturn({
        supplierId: selectedSupplierId,
        purchaseId: selectedPurchase?.id || '',
        items: finalItems,
        totalValue: totalReturnValue,
        reason: selectedReason,
        note,
      })

      // Show Debit Note Voucher Modal
      setDebitNoteModal(result || {
        returnNumber: 'DN-' + String(Date.now()).slice(-6),
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier?.name,
        supplierPhone: selectedSupplier?.phone,
        totalValue: totalReturnValue,
        items: finalItems,
        oldDebt: Number(selectedSupplier?.debtTotal || 0),
        newDebt: Math.max(0, Number(selectedSupplier?.debtTotal || 0) - totalReturnValue),
        reason: fullReason,
        createdAt: new Date(),
      })

      setStep(1)
      setSelectedSupplierId('')
      setSelectedPurchaseId('')
      setReturnItems([])
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!historySearch) return supplierReturns
    const q = historySearch.toLowerCase()
    return supplierReturns.filter(ret => {
      const sup = suppliers.find(s => s.id === ret.supplierId)
      return (
        sup?.name?.toLowerCase().includes(q) ||
        ret.supplierName?.toLowerCase().includes(q) ||
        ret.returnNumber?.toLowerCase().includes(q) ||
        ret.note?.toLowerCase().includes(q) ||
        ret.reason?.toLowerCase().includes(q)
      )
    })
  }, [supplierReturns, suppliers, historySearch])

  // Export History to Excel
  const exportHistoryToExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const rows = supplierReturns.map(ret => {
        const sup = suppliers.find(s => s.id === ret.supplierId)
        const date = ret.createdAt?.toDate?.() || new Date(ret.createdAt || 0)
        return {
          'رقم إشعار الخصم': ret.returnNumber || `DN-${ret.id?.slice(0, 6)}`,
          'اسم المورد': ret.supplierName || sup?.name || 'غير معروف',
          'رقم الهاتف': ret.supplierPhone || sup?.phone || '',
          'تاريخ المرتجع': date.toLocaleDateString('ar-EG'),
          'قيمة المرتجع (ج.م)': Number(ret.totalValue || 0),
          'سبب الإرجاع': ret.reason || ret.note || 'مرتجع بضاعة',
          'عدد الأصناف المرجعة': (ret.items || []).length,
          'المسؤول': ret.cashierName || '',
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'مرتجعات الموردين')
      XLSX.writeFile(workbook, `سجل_مرتجعات_الموردين_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('تم تصدير سجل المرتجعات إلى Excel بنجاح')
    } catch (err) {
      toast.error('حدث خطأ أثناء تصدير الملف')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <RotateCcw size={20} />
            </span>
            مرتجعات الموردين وإشعارات الخصم (Debit Notes)
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 mr-13">
            إرجاع قطع الغيار المعيبة أو التالفة للمورد، خصم قيمتها آلياً من حسابه وتوثيق إشعار الخصم
          </p>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="card !py-2.5 !px-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
            <p className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1">إجمالي المرتجعات</p>
            <p className="text-base font-black text-amber-600 dark:text-amber-400 font-display">
              {supplierReturns.length} <span className="text-[10px] font-normal text-slate-400">عملية</span>
            </p>
          </div>
          {supplierReturns.length > 0 && (
            <button
              onClick={exportHistoryToExcel}
              className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download size={14} /> تصدير إكسيل
            </button>
          )}
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 px-1">
        {['1. اختيار المورد', '2. فاتورة الشراء', '3. تحديد الكميات والأسباب'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
              step === idx + 1
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : step > idx + 1
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                step > idx + 1 ? 'bg-emerald-500 text-white' : step === idx + 1 ? 'bg-amber-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </span>
              {label}
            </div>
            {idx < 2 && <div className={`h-px flex-1 w-6 ${step > idx + 1 ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: اختيار المورد */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative group">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              placeholder="ابحث عن مورد بالاسم أو رقم الهاتف للمرتجع..."
              className="input w-full pr-11 text-xs !rounded-2xl"
            />
          </div>
          {filteredSuppliers.length === 0 ? (
            <div className="card border-dashed border-slate-200 dark:border-slate-800 text-center py-20">
              <Truck size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">لا يوجد موردون يطابقون البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSuppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSupplier(s.id)}
                  className="card !p-4 text-right hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Truck size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">{s.phone || 'بدون رقم هاتف'}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-[10px] text-slate-400 block font-bold">المديونية:</span>
                      <span className={`text-xs font-black ${Number(s.debtTotal || 0) > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {Number(s.debtTotal || 0).toLocaleString()} ج.م
                      </span>
                    </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost !px-3 !py-2 text-xs font-black">
                ← تغيير المورد
              </button>
              <div className="card !py-2 !px-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/20">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-black">المورد: {selectedSupplier?.name}</span>
                <span className="text-[11px] text-slate-400 font-bold mr-2">({selectedSupplier?.phone || 'بدون رقم'})</span>
              </div>
            </div>
          </div>

          <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 px-1">
            <FileText size={16} className="text-amber-500" />
            اختر فاتورة الشراء الأصلية المراد الإرجاع منها:
          </h2>

          <div className="space-y-3">
            {supplierPurchases.map(p => {
              const date = p.createdAt?.toDate?.() || new Date(p.createdAt || 0)
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPurchase(p)}
                  className="card !p-4 w-full text-right hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">فاتورة شراء رقم: {p.billNumber || '—'}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                          {date.toLocaleDateString('ar-EG')} • {(p.items || []).length} صنف مسجل
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        {Number(p.total || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                      </p>
                      {p.dueAmount > 0 && (
                        <p className="text-[10px] text-amber-600 font-black mt-0.5">
                          متبقي: {Number(p.dueAmount).toLocaleString()} ج.م
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            <button
              onClick={handleCustomProductsReturn}
              className="card !p-4 w-full text-right border-dashed hover:border-amber-400 transition-all bg-slate-50/50 dark:bg-slate-800/30"
            >
              <p className="text-primary-600 dark:text-primary-400 font-black text-xs text-center flex items-center justify-center gap-2">
                <PackageX size={16} /> + إرجاع حر مباشر من أصناف المخزن المتاحة (بدون ربط بفاتورة توريد محددة)
              </p>
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: تحديد الكميات والأسباب */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost !px-3 !py-2 text-xs font-black">
                ← رجوع
              </button>
              <div className="card !py-2 !px-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/20 flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-black">{selectedSupplier?.name}</span>
                {selectedPurchase?.billNumber && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] text-slate-400 font-bold">فاتورة #{selectedPurchase.billNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="card !p-5 space-y-3">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              سبب الإرجاع الرسمي (سيتم تضمينه في إشعار الخصم والواتساب):
            </label>
            <div className="flex flex-wrap gap-2">
              {RETURN_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    selectedReason === reason
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                تفاصيل وملاحظات إضافية (اختياري):
              </label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="مثال: شرخ في غلاف الطلمبة، غير متوافق مع شاسيه الجامبو، تم الاتفاق مع المندوب..."
                className="input w-full text-xs !rounded-xl"
              />
            </div>
          </div>

          {/* Return items selection */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
                <PackageX size={16} className="text-amber-500" />
                حدد الكميات المرجعة من الأصناف (الحد الأقصى مرتبط بالرصيد الفعلي بالمخزن):
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto custom-scrollbar">
              {returnItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs">
                  لا توجد أصناف قابلة للإرجاع في هذه الفاتورة
                </div>
              ) : (
                returnItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-amber-50/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        رصيد المخزن الحالي: <span className="text-primary-600 font-black">{item.availableInStock}</span> • تكلفة الشراء للوحدة: <span className="font-mono">{Number(item.cost).toLocaleString()} ج.م</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, (item.qty || 0) - 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >−</button>
                      <input
                        type="number"
                        value={item.qty || 0}
                        min={0}
                        max={item.maxQty}
                        onChange={e => updateQty(item.id, e.target.value)}
                        className="w-14 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-slate-800 dark:text-slate-100 text-xs py-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, (item.qty || 0) + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >+</button>
                      <span className={`text-xs font-black w-24 text-left font-mono ${item.qty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {item.qty > 0 ? `${(item.cost * item.qty).toLocaleString()} ج` : '—'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Financial summary */}
          <AnimatePresence>
            {totalReturnValue > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card !p-5 border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي قيمة المرتجع المستردة:</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-display">
                      {totalReturnValue.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">مديونية المورد الحالية:</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                      {Number(selectedSupplier?.debtTotal || 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">المديونية بعد خصم المرتجع:</span>
                    <span className="text-sm font-black text-emerald-600">
                      {Math.max(0, Number(selectedSupplier?.debtTotal || 0) - totalReturnValue).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-3 border-t border-amber-100 dark:border-amber-900/30 pt-2">
                  * سيتم تلقائياً خصم القيمة من رصيد المورد وتحديث كميات المخزن وتوثيق العملية بسجل الرقابة.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setSelectedSupplierId(''); setSelectedPurchaseId(''); setReturnItems([]) }}
              className="btn-ghost !px-6 !py-3 text-xs font-black !rounded-xl"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalReturnValue === 0 || saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 size={16} />
              {saving ? 'جاري تسجيل المرتجع...' : 'تأكيد المرتجع وإصدار إشعار الخصم (Debit Note)'}
            </button>
          </div>
        </motion.div>
      )}

      {/* History Table */}
      {supplierReturns.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-500" />
              سجل إشعارات الخصم والمرتجعات النشطة ({filteredHistory.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="بحث برقم الإشعار أو المورد..."
                className="input w-full pr-9 text-xs !py-1.5 !rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.map(ret => {
              const supplier = suppliers.find(s => s.id === ret.supplierId)
              const date = ret.createdAt?.toDate?.() || new Date(ret.createdAt || 0)
              const returnNo = ret.returnNumber || `DN-${ret.id?.slice(0, 6)}`
              return (
                <div key={ret.id} className="card !p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <RotateCcw size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                            {ret.supplierName || supplier?.name || 'مورد'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-black border border-amber-100 dark:border-amber-900">
                            {returnNo}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {date.toLocaleDateString('ar-EG')} • {(ret.items || []).length} أصناف مرتجعة • السبب: <span className="text-slate-600 dark:text-slate-300 font-bold">{ret.reason || ret.note || 'مرتجع بضاعة'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left">
                        <p className="font-black text-amber-600 dark:text-amber-400 text-base font-display">
                          {Number(ret.totalValue || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                        </p>
                        {ret.cashierName && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{ret.cashierName}</p>}
                      </div>
                      <button
                        onClick={() => setDebitNoteModal(ret)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                        title="معاينة إشعار الخصم وطباعته"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Debit Note Voucher Modal ────────────────────────────────────────── */}
      {debitNoteModal && (
        <DebitNoteModal
          data={debitNoteModal}
          onClose={() => setDebitNoteModal(null)}
          suppliers={suppliers}
        />
      )}
    </motion.div>
  )
}

function DebitNoteModal({ data, onClose, suppliers }) {
  const supplier = suppliers.find(s => s.id === data.supplierId)
  const supplierName = data.supplierName || supplier?.name || 'مورد'
  const supplierPhone = data.supplierPhone || supplier?.phone || ''
  const dateStr = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const returnNo = data.returnNumber || `DN-${data.id?.slice(0, 6)}`

  const handlePrint = () => {
    window.print()
  }

  const handleSendWhatsApp = () => {
    const formattedPhone = formatPhoneForWhatsApp(supplierPhone) || ''
    const itemsList = (data.items || []).map(i => `• ${i.name} (${i.qty} قطعة × ${Number(i.cost).toLocaleString()} ج.م = ${(i.cost * i.qty).toLocaleString()} ج.م)`).join('\n')

    const msg = 
      `📋 *إشعار خصم مرتجع بضاعة (Debit Note)*\n` +
      `🔢 *رقم الإشعار:* ${returnNo}\n` +
      `🗓️ *التاريخ:* ${dateStr}\n` +
      `👤 *السيد المورد:* ${supplierName}\n` +
      `────────────────────\n` +
      `📦 *الأصناف المرجعة:*\n` +
      `${itemsList}\n` +
      `────────────────────\n` +
      `💵 *إجمالي قيمة المرتجع المستردة:* *${Number(data.totalValue || 0).toLocaleString()} ج.م*\n` +
      `⚠️ *السبب المعتمد:* ${data.reason || data.note || 'مرتجع بضاعة'}\n` +
      (data.newDebt !== undefined ? `📊 *رصيد حسابكم المتبقي بعد الخصم:* *${Number(data.newDebt).toLocaleString()} ج.م*\n` : '') +
      `────────────────────\n` +
      `🏢 *صادر من: مركز الفاروق لخدمات وقطع غيار سيارات النقل التجاري*`

    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                إشعار خصم مرتجع للمورد (Debit Note)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-bold">{returnNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500">
            <X size={16} />
          </button>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs" id="debit-note-print">
          {/* Brand & Supplier Info */}
          <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-primary-600 tracking-wider">ELFAROUK SERVICE</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">مركز الفاروق لقطع الغيار</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">تاريخ الإصدار: {dateStr}</p>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block">إلى السيد المورد:</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">{supplierName}</span>
              {supplierPhone && <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{supplierPhone}</p>}
            </div>
          </div>

          {/* Reason Badge */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 rounded-2xl">
            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 block">سبب الإرجاع والخصم:</span>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-0.5">
              {data.reason || data.note || 'مرتجع بضاعة معيبة / غير مطابقة'}
            </p>
            {data.note && data.reason && data.note !== data.reason && (
              <p className="text-[10px] text-slate-500 mt-1 italic">ملاحظات: {data.note}</p>
            )}
          </div>

          {/* Returned Items Table */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                <tr>
                  <th className="p-2.5">اسم الصنف</th>
                  <th className="p-2.5 text-center">الكمية</th>
                  <th className="p-2.5 text-center">سعر التكلفة</th>
                  <th className="p-2.5 text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-black text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="p-2.5 text-center font-black text-amber-600">{item.qty}</td>
                    <td className="p-2.5 text-center font-bold text-slate-500">{Number(item.cost).toLocaleString()} ج</td>
                    <td className="p-2.5 text-center font-black text-slate-800 dark:text-slate-100 font-mono">
                      {(item.cost * item.qty).toLocaleString()} ج
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center font-black">
              <span className="text-slate-500 text-xs">إجمالي قيمة المرتجع المستردة:</span>
              <span className="text-base text-amber-600 dark:text-amber-400 font-display">
                {Number(data.totalValue || 0).toLocaleString()} ج.م
              </span>
            </div>
            {data.newDebt !== undefined && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold">الرصيد المتبقي بحساب المورد بعد الخصم:</span>
                <span className="font-black text-emerald-600">{Number(data.newDebt).toLocaleString()} ج.م</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer size={15} /> طباعة
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Send size={15} /> إرسال إشعار الخصم عبر واتساب للمورد
          </button>
          <button onClick={onClose} className="px-3 py-2 btn-ghost text-xs font-bold">
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  )
}
