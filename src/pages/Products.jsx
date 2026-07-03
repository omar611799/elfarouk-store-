import { useState, useRef, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, UploadCloud, QrCode, Printer, X, Filter, Sparkles, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EMPTY = { name: '', category: '', price: '', cost: '', quantity: '', minStock: '5', sku: '', supplier: '', image: '' }

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, importProductsBatch } = useStore()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [qrModal, setQrModal] = useState(null)
  const [reorderModal, setReorderModal] = useState(false)
  const fileInputRef = useRef(null)

  const filtered = products.filter(p =>
    (!search    || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )

  const lowStockCount = products.filter(p => p.quantity <= (p.minStock || 5)).length

  // ✅ Fix #5: Generate reorder suggestions based on minStock
  const reorderSuggestions = useMemo(() => {
    return products
      .filter(p => p.quantity <= (p.minStock || 5))
      .map(p => {
        const deficit = Math.max(0, (p.minStock || 5) * 2 - p.quantity)
        const suggestedQty = deficit > 0 ? deficit : 10 // الاقتراح الافتراضي
        const estimatedCost = suggestedQty * (p.cost || 0)
        return { ...p, suggestedQty, estimatedCost }
      })
  }, [products])

  const totalEstimatedReorderCost = reorderSuggestions.reduce((acc, curr) => acc + curr.estimatedCost, 0)

  const exportReorderToExcel = () => {
    if (reorderSuggestions.length === 0) return
    const data = reorderSuggestions.map(s => ({
      'اسم القطعة': s.name,
      'كود SKU': s.sku || '',
      'الفئة': s.category || '',
      'المخزون الحالي': s.quantity,
      'الحد الأدنى': s.minStock || 5,
      'الكمية المقترحة للشراء': s.suggestedQty,
      'سعر التكلفة للواحدة': s.cost || 0,
      'التكلفة الإجمالية المتوقعة': s.estimatedCost,
      'المورد المحتمل': s.supplier || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'اقتراحات الشراء')
    XLSX.writeFile(workbook, `طلبات_الشراء_المقترحة_${new Date().toLocaleDateString('en-GB')}.xlsx`)
  }

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => { setEditing(p.id); setForm({ ...EMPTY, ...p }); setModal(true) }
  const close    = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.name || !form.price) return toast.error('اسم المنتج والسعر مطلوبان')
    const data = {
      ...form,
      price:    Number(form.price),
      cost:     Number(form.cost || 0),
      quantity: Number(form.quantity || 0),
      minStock: Number(form.minStock || 5),
    }
    if (editing) await updateProduct(editing, data)
    else         await addProduct(data)
    close()
  }


  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const wb  = XLSX.read(evt.target.result, { type: 'binary' })
        const ws  = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)
        const formatted = data.map(row => ({
          name:     row['الاسم']    || row['name']     || '',
          price:    Number(row['السعر']    || row['price']    || 0),
          cost:     Number(row['التكلفة']  || row['cost']     || 0),
          quantity: Number(row['الكمية']   || row['quantity'] || 0),
          category: row['الفئة']   || row['category'] || '',
          sku:      String(row['الكود']    || row['sku']      || Date.now().toString().slice(-6)),
        })).filter(item => item.name && item.price > 0)
        if (formatted.length === 0) { toast.error('لم يتم العثور على بيانات صالحة'); return }
        if (window.confirm(`استيراد ${formatted.length} منتج؟`)) {
          const t = toast.loading('جاري الاستيراد...')
          await importProductsBatch(formatted)
          toast.dismiss(t)
        }
      } catch { toast.error('خطأ في الملف') }
      e.target.value = null
    }
    reader.readAsBinaryString(file)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-primary-600" />
            </span>
            المخزن وقطع الغيار
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1">
            إجمالي القطع: <span className="text-primary-600 font-black">{products.length}</span>
            {lowStockCount > 0 && <span className="mr-3 text-rose-500 font-black">{lowStockCount} منخفضة</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()}
            className="btn-ghost flex items-center gap-2 text-xs">
            <UploadCloud size={15} className="text-emerald-500" /> استيراد Excel
          </button>
          <button onClick={() => setReorderModal(true)}
            className="btn-ghost flex items-center gap-2 text-xs text-violet-600 border border-violet-200 bg-violet-50/50 hover:bg-violet-100">
            <Sparkles size={14} /> اقتراحات الشراء الذكية
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> إضافة منتج
          </button>
        </div>

      </div>

      {/* ── Summary Mini Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="كل المنتجات" value={products.length} color="primary" />
        <MiniStat label="منخفض المخزون" value={lowStockCount} color="rose" alert />
        <MiniStat label="الفئات" value={categories.length} color="slate" />
        <MiniStat label="الموردين" value={suppliers.length} color="emerald" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md py-2">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود SKU..." className="input pr-11 !rounded-2xl" />
        </div>
        <div className="relative sm:w-52">
          <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="input pr-10 !rounded-2xl appearance-none text-sm">
            <option value="">كل الفئات</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Products Grid ── */}
      {filtered.length === 0 ? (
        <div className="card text-center py-20 border-dashed">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold">لا توجد منتجات تطابق البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p, idx) => {
              const isLow = p.quantity <= (p.minStock || 5)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`card !p-0 overflow-hidden hover:shadow-xl transition-all duration-500 group
                    ${isLow ? 'border-rose-200 bg-rose-50/30' : 'hover:border-primary-200'}`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 px-5 py-5 border-b border-slate-100">
                    {/* Product Icon */}
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                      {p.image
                        ? <img src={p.image} className="w-full h-full object-cover" />
                        : <Package size={24} className="text-slate-300" />}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-950 text-base truncate">{p.name}</p>
                        {isLow && <AlertTriangle size={15} className="text-rose-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300">{p.sku || '–'}</span>
                        {p.category && <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-md border border-primary-100">{p.category}</span>}
                        {p.image && p.image.length > 100000 && (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 animate-pulse">
                            ⚠️ حجم الصورة كبير (يرجى تعديلها لضغطها)
                          </span>
                        )}
                      </div>
                    </div>
                    </div>

                    <div className="px-5 py-4 grid grid-cols-2 gap-4 bg-slate-50/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">المخزن</p>
                        <p className={`text-xl font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>{p.quantity} <small className="text-[10px] font-normal text-slate-400">قطعة</small></p>
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">السعر</p>
                        <p className="text-xl font-black text-primary-600 font-display">{Number(p.price).toLocaleString()} <small className="text-[10px] font-normal">ج</small></p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(p)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                      <button onClick={() => setQrModal(p)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                          <QrCode size={16} />
                      </button>
                      <button onClick={() => { if (window.confirm('حذف هذا المنتج؟')) deleteProduct(p.id) }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                      </button>
                      </div>
                      {p.supplier && <span className="text-[9px] font-black text-slate-400 uppercase">{p.supplier}</span>}
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={close}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Handle (mobile) */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />

              <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
                <button onClick={close} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="sm:col-span-2">
                  <label className="label-text">اسم المنتج *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input mt-1" placeholder="مثلاً: مساعدين أمامية تويوتا" />
                </div>
                <div>
                  <label className="label-text">كود SKU</label>
                  <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                    className="input mt-1" placeholder="123-ABC" />
                </div>
                <div>
                  <label className="label-text">الفئة</label>
                  <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="input mt-1">
                    <option value="">غير مصنف</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">سعر البيع *</label>
                  <div className="relative mt-1">
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      className="input pr-12" placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                  </div>
                </div>
                <div>
                  <label className="label-text">سعر التكلفة</label>
                  <div className="relative mt-1">
                    <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                      className="input pr-12" placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                  </div>
                </div>
                <div>
                  <label className="label-text">الكمية المتاحة</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="input mt-1" placeholder="0" />
                </div>
                <div>
                  <label className="label-text">حد التنبيه (أقل من)</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))}
                    className="input mt-1 border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" placeholder="5" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">المورد</label>
                  <select value={form.supplier || ''} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                    className="input mt-1">
                    <option value="">بدون مورد</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">صورة المنتج</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {form.image ? (
                        <img src={form.image} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-slate-300" />
                      )}
                    </div>
                    <label className="btn-ghost text-xs cursor-pointer flex items-center gap-2">
                      <UploadCloud size={14} />
                      رفع صورة المنتج
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (evt) => {
                              const img = new Image()
                              img.src = evt.target.result
                              img.onload = () => {
                                const canvas = document.createElement('canvas')
                                const MAX_WIDTH = 300
                                const MAX_HEIGHT = 300
                                let width = img.width
                                let height = img.height
                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width
                                    width = MAX_WIDTH
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height
                                    height = MAX_HEIGHT
                                  }
                                }
                                canvas.width = width
                                canvas.height = height
                                const ctx = canvas.getContext('2d')
                                ctx.drawImage(img, 0, 0, width, height)
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
                                setForm(p => ({ ...p, image: dataUrl }))
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, image: '' }))}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
                <button onClick={close} className="btn-ghost flex-1">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2]">
                  {editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* QR Modal */}
        {qrModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            onClick={() => setQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="print-area">
                <p className="text-[10px] font-black uppercase text-primary-600 mb-1">ELFAROUK SERVICE</p>
              <h3 className="text-xl font-black text-slate-800 mb-1">{qrModal.name}</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">SKU: {qrModal.sku || qrModal.id}</p>
              <div className="bg-white p-5 border-4 border-slate-100 rounded-2xl inline-block mb-6 shadow-inner">
                <QRCodeSVG value={qrModal.sku || qrModal.id} size={160} />
              </div>
                <p className="text-2xl font-black text-slate-900 mb-4">{qrModal.price} ج.م</p>
              </div>

              <div className="space-y-3">
                <button onClick={() => window.print()} className="btn-primary w-full">
                  <Printer size={16} /> طباعة ملصق الرف
                </button>
                <button onClick={() => setQrModal(null)} className="btn-ghost w-full">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Smart Reorder suggestions modal */}
        {reorderModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setReorderModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] text-right"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">اقتراحات الشراء الذكية</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">تجنب نفاد قطع الغيار الهامة</p>
                  </div>
                </div>
                <button onClick={() => setReorderModal(false)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-2 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">عدد الأصناف المقترحة</p>
                    <p className="text-xl font-black text-violet-700">{reorderSuggestions.length} صنف</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">التكلفة التقريبية المقدرة</p>
                    <p className="text-xl font-black text-emerald-600">{totalEstimatedReorderCost.toLocaleString()} ج.م</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reorderSuggestions.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <p className="text-slate-400 text-xs font-bold">جميع المنتجات بمخزون كافٍ وممتاز! 👍</p>
                    </div>
                  ) : (
                    reorderSuggestions.map(item => (
                      <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="font-black text-slate-800 text-sm">{item.name}</p>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-bold">
                            <span>المخزون الحالي: <strong className="text-rose-500">{item.quantity}</strong></span>
                            <span>الحد الأدنى: <strong>{item.minStock || 5}</strong></span>
                            {item.supplier && <span>المورد: <strong>{item.supplier}</strong></span>}
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-black text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg">
                            اقتراح طلب: {item.suggestedQty} قطة
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">التكلفة: {(item.suggestedQty * (item.cost || 0)).toLocaleString()} ج</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/80 flex gap-3">
                <button onClick={() => setReorderModal(false)} className="btn-ghost flex-1 py-3">إغلاق</button>
                <button onClick={exportReorderToExcel} disabled={reorderSuggestions.length === 0}
                  className="btn-primary flex-[2] py-3 flex items-center justify-center gap-2 !bg-violet-600 hover:!bg-violet-750 disabled:opacity-30">
                  <Download size={14} /> تصدير الاقتراحات لـ Excel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Global label style helper */}
      <style>{`.label-text { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }`}</style>
    </motion.div>
  )
}

function MiniStat({ label, value, color, alert }) {
  const palette = {
    primary: 'bg-primary-50 text-primary-700',
    rose:    'bg-rose-50 text-rose-700',
    slate:   'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-1 ${palette[color]}`}>
      <p className={`text-2xl font-black ${alert && value > 0 ? 'text-rose-600' : ''}`}>{value}</p>
      <p className="text-[10px] font-bold opacity-70">{label}</p>
    </div>
  )
}
