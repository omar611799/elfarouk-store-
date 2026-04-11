import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Truck } from 'lucide-react'

const EMPTY = { name: '', phone: '', address: '', notes: '' }

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useStore()
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (s) => { setEditing(s.id); setForm({ ...EMPTY, ...s }); setModal(true) }

  const handleSubmit = async () => {
    if (!form.name) return
    if (editing) await updateSupplier(editing, form)
    else await addSupplier(form)
    setModal(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">الموردين</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة مورد
        </button>
      </div>

      <div className="space-y-2">
        {suppliers.map(s => (
          <div key={s.id} className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{s.name}</p>
              {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <Edit2 size={15} />
              </button>
              <button onClick={() => deleteSupplier(s.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا يوجد موردين بعد</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white">{editing ? 'تعديل المورد' : 'إضافة مورد'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'name', label: 'اسم المورد *' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'address', label: 'العنوان' },
                { key: 'notes', label: 'ملاحظات' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input text-sm" />
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 text-sm">إلغاء</button>
              <button onClick={handleSubmit} className="btn-primary flex-1 text-sm">{editing ? 'حفظ' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
