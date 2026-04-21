import { useState, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, UploadCloud, QrCode, Printer, X, Filter, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EMPTY = { name: '', category: '', price: '', cost: '', quantity: '', minStock: '5', sku: '', supplier: '' }

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, importProductsBatch } = useStore()
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [qrModal, setQrModal]     = useState(null)
  const fileInputRef = useRef(null)

  const filtered = products.filter(p =>
    (!search    || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )

  const lowStockCount = products.filter(p => p.quantity <= (p.minStock || 5)).length

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
        <div className="flex items-center gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()}
            className="btn-ghost flex items-center gap-2 text-xs">
            <UploadCloud size={15} className="text-emerald-500" /> استيراد Excel
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
      <div className="flex flex-col sm:flex-row gap-3">
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
        <div className="grid grid-cols-1 gap-3">
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
                  className={`card !p-0 overflow-hidden hover:shadow-md transition-all duration-300 group
                    ${isLow ? 'border-rose-200' : 'hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Product Icon */}
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform overflow-hidden">
                      {p.image
                        ? <img src={p.image} className="w-full h-full object-cover" />
                        : <Package size={20} className="text-slate-400" />}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-slate-800 text-sm truncate">{p.name}</p>
                        {isLow && <AlertTriangle size={13} className="text-rose-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{p.sku || '–'}</span>
                        {p.category && <span className="text-[9px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md">{p.category}</span>}
                        {p.supplier && <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.supplier}</span>}
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div className="text-center hidden sm:block px-4 border-x border-slate-100">
                      <p className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>{p.quantity}</p>
                      <p className="text-[9px] font-bold text-slate-400">في المخزن</p>
                    </div>

                    {/* Price */}
                    <div className="text-left hidden sm:block px-4">
                      <p className="text-lg font-black text-slate-800">{Number(p.price).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400">ج.م</p>
                    </div>

                    {/* Mobile: stock + price */}
                    <div className="sm:hidden text-left shrink-0">
                      <p className="text-sm font-black text-slate-800">{Number(p.price).toLocaleString()} ج</p>
                      <p className={`text-[10px] font-bold ${isLow ? 'text-rose-500' : 'text-slate-400'}`}>{p.quantity} متبقي</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 sm:gap-1.5 shrink-0">
                      <button onClick={() => setQrModal(p)}
                        className="p-3 sm:p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all">
                        <QrCode size={18} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-3 sm:p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all">
                        <Edit2 size={18} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                      <button onClick={() => { if (window.confirm('حذف هذا المنتج؟')) deleteProduct(p.id) }}
                        className="p-3 sm:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                    </div>
                  </div>

                  {/* Low Stock Banner */}
                  {isLow && (
                    <div className="bg-rose-50 border-t border-rose-100 px-5 py-2 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-rose-500" />
                      <p className="text-[10px] font-black text-rose-600">مخزون منخفض — أقل من الحد المطلوب ({p.minStock || 5})</p>
                    </div>
                  )}
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
              <h3 className="text-xl font-black text-slate-800 mb-1">{qrModal.name}</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">SKU: {qrModal.sku || qrModal.id}</p>
              <div className="bg-white p-5 border-4 border-slate-100 rounded-2xl inline-block mb-6 shadow-inner">
                <QRCodeSVG value={qrModal.sku || qrModal.id} size={160} />
              </div>
              <div className="space-y-3">
                <button onClick={() => window.print()} className="btn-primary w-full">
                  <Printer size={16} /> طباعة الملصق
                </button>
                <button onClick={() => setQrModal(null)} className="btn-ghost w-full">إغلاق</button>
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
