import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react'

const EMPTY = { name: '', category: '', price: '', cost: '', quantity: '', minStock: '5', sku: '', supplier: '' }

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct } = useStore()
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">قطع الغيار</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة قطعة
        </button>
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
        <div className="card text-center py-12">
          <Package size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد قطع غيار</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
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
                <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
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
            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button onClick={close} className="btn-ghost flex-1 text-sm">إلغاء</button>
              <button onClick={handleSubmit} className="btn-primary flex-1 text-sm">
                {editing ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
