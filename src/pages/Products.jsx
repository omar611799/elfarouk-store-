import { useState, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, UploadCloud, QrCode, Printer, X, Sparkles, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EMPTY = { name: '', category: '', price: '', cost: '', quantity: '', minStock: '5', sku: '', supplier: '' }

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, importProductsBatch } = useStore()
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [qrModal, setQrModal]   = useState(null)
  const fileInputRef = useRef(null)

  const filtered = products.filter(p =>
    (!search    || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  )

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => { setEditing(p.id); setForm({ ...EMPTY, ...p }); setModal(true) }
  const close    = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.name || !form.price) return
    const data = {
      ...form,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      quantity: Number(form.quantity || 0),
      minStock: Number(form.minStock || 5),
    }
    if (editing) await updateProduct(editing, data)
    else await addProduct(data)
    close()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const formatted = data.map(row => ({
          name: row['الاسم'] || row['name'] || '',
          price: Number(row['السعر'] || row['price'] || 0),
          cost: Number(row['التكلفة'] || row['cost'] || 0),
          quantity: Number(row['الكمية'] || row['quantity'] || 0),
          category: row['الفئة'] || row['category'] || '',
          sku: String(row['الكود'] || row['sku'] || Date.now().toString().slice(-6)),
        })).filter(item => item.name && item.price > 0);
        if (formatted.length === 0) {
          toast.error('لم يتم العثور على بيانات صالحة في الملف');
          return;
        }
        if (window.confirm(`استيراد ${formatted.length} منتج جديد؟`)) {
          const loading = toast.loading('جاري التحديث...');
          await importProductsBatch(formatted);
          toast.dismiss(loading);
          toast.success('تم التحديث بنجاح');
        }
      } catch (err) {
        toast.error('خطأ في الملف');
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                    <Package size={22} className="text-electric-400" />
                </div>
                المخزن وقطع الغيار
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي القطع: {products.length}</p>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost !px-5 !py-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/5 bg-white/5"
          >
            <UploadCloud size={16} className="text-emerald-400" /> استيراد إكسيل
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="btn-primary">
            <Plus size={18} /> إضافة قطعة
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..." className="input pr-12 text-sm"
          />
        </div>
        <div className="relative group min-w-[200px]">
            <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input pr-12 text-xs font-black uppercase tracking-widest">
                <option value="">كل الفئات</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-24 border-dashed border-white/5 opacity-30">
          <Package size={60} className="text-slate-500 mx-auto mb-6" />
          <p className="text-slate-500 font-black uppercase tracking-widest">المخزن لا يحتوي على نتائج لهذا البحث</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
          {filtered.map(p => (
            <motion.div variants={itemVariant} layout key={p.id} className="card !py-5 !px-8 hover:border-electric-500/30 group relative flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 bg-obsidian-950 border border-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:border-electric-500/20">
                <Package size={24} className="text-electric-400/50 group-hover:text-electric-400 transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0 md:text-right text-center">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <p className="font-black text-white text-lg tracking-tight group-hover:text-electric-400 transition-colors font-display leading-none">{p.name}</p>
                    <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded-md self-center">{p.sku || 'NO-SKU'}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {p.category && <span className="badge-blue !text-[9px] !px-3 font-black">{p.category}</span>}
                  <span className={p.quantity <= (p.minStock || 5) ? 'badge-red' : 'badge-green'}>
                     المخزن: {p.quantity} قطعة
                  </span>
                  {p.quantity <= (p.minStock || 5) && (
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
              </div>

              <div className="md:px-10 py-2 border-x border-white/5 hidden md:block">
                <p className="font-black text-white text-2xl font-display tracking-tighter">{Number(p.price).toLocaleString()} <span className="text-xs text-slate-500 font-normal">ج.م</span></p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60 text-left">التكلفة: {Number(p.cost || 0).toLocaleString()}</p>
              </div>

              <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-all">
                <button onClick={() => setQrModal(p)} className="p-3 bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-2xl transition-all" title="QR">
                  <QrCode size={18} />
                </button>
                <button onClick={() => openEdit(p)} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="card !p-0 w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white font-display">{editing ? 'تعديل البيانات' : 'إضافة قطعة جديدة'}</h2>
                <button onClick={close} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto scrollbar-none custom-scrollbar">
                <div className="md:col-span-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">اسم القطعة *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" />
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">كود القطعة (SKU)</label>
                    <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className="input" />
                </div>
                <div>
                   <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">الفئة</label>
                    <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input text-sm">
                        <option value="">غير مصنف</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">سعر البيع *</label>
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input border-electric-500/20" />
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">سعر التكلفة</label>
                    <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="input" />
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">الكمية الحالية</label>
                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="input" />
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">تنبيه عند وصول الرصيد لـ</label>
                    <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} className="input text-rose-400" />
                </div>
              </div>
              <div className="p-8 border-t border-white/5 flex gap-4">
                <button onClick={close} className="btn-ghost flex-1">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2]">
                  {editing ? 'تحديث البيانات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* QR Code Modal */}
        {qrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/90 backdrop-blur-2xl z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="card !p-0 max-w-sm w-full shadow-premium border-white/10 text-center overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-cyan-500 to-electric-500" />
                <div className="p-10">
                    <h3 className="text-2xl font-black text-white mb-2 font-display leading-tight">{qrModal.name}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">SKU: {qrModal.sku || qrModal.id}</p>
                    
                    <div className="bg-white p-6 rounded-[2rem] mx-auto mb-10 shadow-2xl border-8 border-obsidian-900">
                        <QRCodeSVG id="product-qr" value={qrModal.sku || qrModal.id} size={180} />
                    </div>
                    
                    <div className="space-y-4">
                        <button onClick={() => window.print()} className="w-full btn-primary !py-4">
                            <Printer size={18} /> طباعة الملصق
                        </button>
                        <button onClick={() => setQrModal(null)} className="btn-ghost w-full">إغلاق</button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
