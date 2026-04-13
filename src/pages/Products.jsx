import { useState, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, UploadCloud, QrCode, Printer } from 'lucide-react'
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
    (!search    || p.name?.includes(search) || p.sku?.includes(search)) &&
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
          quantity: Number(row['الكمية'] || row['quantity'] || 0),
          category: row['الفئة'] || row['category'] || '',
          sku: String(row['الكود'] || row['sku'] || ''),
        })).filter(item => item.name && item.price > 0);

        if (formatted.length === 0) {
          toast.error('لا يمكن قراءة الإكسيل. يرجى التأكد من أسماء الأعمدة (الاسم، السعر).');
          return;
        }

        if (window.confirm(`تم العثور على ${formatted.length} منتج صالح. هل تريد تحديث المخزن بهم الآن؟`)) {
          const loadingToast = toast.loading('جاري الاستيراد والتحديث، يرجى الانتظار...');
          await importProductsBatch(formatted);
          toast.dismiss(loadingToast);
        }
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء قراءة الملف');
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">قطع الغيار</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors shadow-glow"
            title="استيراد وتحديث المخزن من ملف Excel"
          >
            <UploadCloud size={16} /> رفع إكسيل
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> إضافة قطعة
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..." className="input pr-9 text-sm"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-36 text-sm">
          <option value="">كل الفئات</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12">
          <Package size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد قطع غيار</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {filtered.map(p => (
            <motion.div variants={itemVariant} layout key={p.id} className="glass-card flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {p.category && <span className="badge-blue">{p.category}</span>}
                  <span className={p.quantity <= (p.minStock || 5) ? 'badge-red' : 'badge-green'}>
                    {p.quantity} قطعة
                  </span>
                  {p.quantity <= (p.minStock || 5) && (
                    <AlertTriangle size={12} className="text-yellow-400" />
                  )}
                </div>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-primary-400 text-sm">{Number(p.price).toLocaleString()} ج.م</p>
                <p className="text-xs text-slate-500">تكلفة: {Number(p.cost || 0).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setQrModal(p)} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="توليد QR كود">
                  <QrCode size={15} />
                </button>
                <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="glass border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-bold text-white">{editing ? 'تعديل القطعة' : 'إضافة قطعة جديدة'}</h2>
                <button onClick={close} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { key: 'name', label: 'اسم القطعة *', type: 'text' },
                  { key: 'sku',  label: 'كود القطعة', type: 'text' },
                  { key: 'price', label: 'سعر البيع *', type: 'number' },
                  { key: 'cost', label: 'سعر التكلفة', type: 'number' },
                  { key: 'quantity', label: 'الكمية', type: 'number' },
                  { key: 'minStock', label: 'الحد الأدنى للتنبيه', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                    <input
                      type={f.type} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="input text-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">الفئة</label>
                  <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input text-sm">
                    <option value="">بدون فئة</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">المورد</label>
                  <select value={form.supplier || ''} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} className="input text-sm">
                    <option value="">بدون مورد</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex gap-3">
                <button onClick={close} className="btn-ghost flex-1 text-sm">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-1 text-sm">
                  {editing ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* QR Code Modal */}
        {qrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-primary-500" />
                <button onClick={() => setQrModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1">{qrModal.name}</h3>
                <p className="text-sm text-slate-500 mb-6">كود: {qrModal.sku || qrModal.id}</p>
                
                <div className="bg-slate-50 p-6 rounded-2xl inline-block border-2 border-slate-100 shadow-inner mb-6">
                    <QRCodeSVG 
                        id="product-qr"
                        value={qrModal.sku || qrModal.id} 
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="bg-slate-950 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Printer size={18} /> طباعة الملصق
                    </button>
                    <p className="text-[10px] text-slate-400 px-4">
                        يمكنك استخدام كاميرا برنامج "الفاروق ستور" لمسح هذا الكود في صفحة المبيعات والبحث عن القطعة فوراً.
                    </p>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
