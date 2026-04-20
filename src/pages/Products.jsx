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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                    <Package size={20} className="text-electric-400" />
                </div>
                المخزن وقطع الغيار
            </h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي القطع: {products.length}</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost !px-4 sm:!px-5 !py-2.5 sm:!py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/5 bg-white/5 flex-1 sm:flex-none"
          >
            <UploadCloud size={14} className="text-emerald-400" /> استيراد
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="btn-primary !px-4 sm:!px-6 !py-2.5 sm:!py-3 text-[10px] sm:text-sm flex-1 sm:flex-none">
            <Plus size={16} /> إضافة قطعة
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..." className="input pr-10 text-sm"
          />
        </div>
        <div className="relative group sm:min-w-[200px]">
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input pr-10 text-[10px] font-black uppercase tracking-widest">
                <option value="">كل الفئات</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-20 sm:py-24 border-dashed border-white/5 opacity-30">
          <Package size={50} className="text-slate-500 mx-auto mb-6" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">المخزن لا يحتوي على نتائج للهذا البحث</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-2.5 sm:gap-4">
          {filtered.map(p => (
            <motion.div variants={itemVariant} layout key={p.id} className="card !py-3 !px-4 sm:!py-5 sm:!px-8 hover:border-electric-500/30 group relative flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-electric-500/[0.02] blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 bg-obsidian-950 border border-white/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-500 shadow-xl group-hover:border-electric-500/20">
                  <Package size={20} className="text-electric-400/50 group-hover:text-electric-400 transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-black text-white text-sm sm:text-lg tracking-tight group-hover:text-electric-400 transition-colors font-display truncate leading-tight">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[7px] sm:text-[10px] text-slate-600 font-black tracking-widest uppercase bg-white/5 px-1.5 py-0.5 rounded-md">{p.sku || 'N/A'}</span>
                    {p.category && <span className="text-[7px] sm:text-[9px] text-electric-400/70 font-black uppercase tracking-widest">{p.category}</span>}
                  </div>
                </div>

                <div className="sm:hidden text-left shrink-0">
                  <p className="font-black text-white text-base font-display tracking-tight">
                    {Number(p.price).toLocaleString('en-US')}
                  </p>
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">ج.م</p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-2 border-t border-white/5 pt-3 sm:pt-0 sm:border-0 mt-1 sm:mt-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] sm:text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${p.quantity <= (p.minStock || 5) ? 'bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {p.quantity} قطعة
                  </span>
                </div>

                <div className="sm:px-8 2xl:px-10 py-1 border-x border-white/5 hidden sm:block">
                  <p className="font-black text-white text-xl 2xl:text-2xl font-display tracking-tighter">{Number(p.price).toLocaleString('en-US')} <span className="text-xs text-slate-500 font-normal">ج.م</span></p>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5 opacity-60 text-left">Cost: {Number(p.cost || 0).toLocaleString('en-US')}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setQrModal(p)} className="p-2.5 bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all active:scale-95">
                    <QrCode size={14} />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) deleteProduct(p.id) }} className="p-2.5 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal Overlay / Bottom Sheet */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-obsidian-900 w-full max-w-xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t sm:border border-white/10 overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 sm:hidden" />
              
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">{editing ? 'تعديل البيانات' : 'إضافة قطعة جديدة'}</h2>
                <button onClick={close} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="sm:col-span-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">اسم القطعة *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input text-sm" placeholder="مثلاً: مساعدين أمامية" />
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">كود القطعة (SKU)</label>
                    <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className="input text-sm" placeholder="123456" />
                </div>
                <div>
                   <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">الفئة</label>
                    <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input text-sm h-[46px]">
                        <option value="">غير مصنف</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">سعر البيع *</label>
                    <div className="relative">
                        <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input border-electric-500/20 pr-10" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-black">ج.م</span>
                    </div>
                </div>
                <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">سعر التكلفة</label>
                    <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="input text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                    <div>
                        <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">الكمية</label>
                        <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="input text-sm" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">حد الطلب (المنبه)</label>
                        <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} className="input text-rose-400 text-sm" />
                    </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 border-t border-white/5 flex gap-3 sm:gap-4 bg-obsidian-950/50">
                <button onClick={close} className="btn-ghost flex-1 py-4 text-[10px] font-black uppercase tracking-widest">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2] py-4 text-[10px] font-black uppercase tracking-widest shadow-neon">
                  {editing ? 'تحديث البيانات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* QR Code Modal */}
        {qrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="card !p-0 max-w-sm w-full shadow-premium border-white/10 text-center overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-electric-500" />
                <div className="p-8 sm:p-10">
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2 font-display leading-tight">{qrModal.name}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 sm:mb-10">SKU: {qrModal.sku || qrModal.id}</p>
                    
                    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] mx-auto mb-8 sm:mb-10 shadow-2xl border-4 sm:border-8 border-obsidian-900">
                        <QRCodeSVG id="product-qr" value={qrModal.sku || qrModal.id} size={150} />
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                        <button onClick={() => window.print()} className="w-full btn-primary !py-3 sm:!py-4 text-[10px] font-black uppercase tracking-widest">
                            <Printer size={16} /> طباعة الملصق
                        </button>
                        <button onClick={() => setQrModal(null)} className="btn-ghost w-full py-2 text-[10px] font-black uppercase tracking-widest">إغلاق</button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

  )
}
