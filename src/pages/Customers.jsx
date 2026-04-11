import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Users, Phone, Car } from 'lucide-react'

const EMPTY = { name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' }

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)

  const filtered = customers.filter(c =>
    !search || c.name?.includes(search) || c.phone?.includes(search)
  )

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ ...EMPTY, ...c }); setModal(true) }

  const handleSubmit = async () => {
    if (!form.name) return
    if (editing) await updateCustomer(editing, form)
    else await addCustomer(form)
    setModal(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">العملاء</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة عميل
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو الهاتف..." className="input text-sm" />

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{c.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {c.phone && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone size={11} /> {c.phone}
                    </span>
                  )}
                  {c.carModel && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Car size={11} /> {c.carModel}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="text-xs font-bold text-primary-400">{Number(c.totalSpent || 0).toLocaleString()} ج.م</p>
                {c.debtTotal > 0 && <span className="badge-red">{Number(c.debtTotal).toLocaleString()} دين</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteCustomer(c.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا يوجد عملاء بعد</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white">{editing ? 'تعديل العميل' : 'إضافة عميل'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'name',         label: 'الاسم *' },
                { key: 'phone',        label: 'رقم الهاتف' },
                { key: 'nationalId',   label: 'الرقم القومي' },
                { key: 'carModel',     label: 'موديل العربية' },
                { key: 'licensePlate', label: 'رقم اللوحة' },
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
