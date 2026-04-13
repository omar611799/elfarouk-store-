import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Users, Phone, Car, History, Wrench, Calendar, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EMPTY = { name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' }

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [historyCustomer, setHistoryCustomer] = useState(null)

  const { invoices } = useStore()

  const customerHistory = useMemo(() => {
    if (!historyCustomer) return []
    // Filter invoices by phone (stricter) or name
    return invoices
      .filter(i => 
        (historyCustomer.phone && i.customerData?.phone === historyCustomer.phone) || 
        (!historyCustomer.phone && i.customerData?.name === historyCustomer.name)
      )
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds) // Sort by date
  }, [historyCustomer, invoices])

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
                <button onClick={() => setHistoryCustomer(c)} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="سجل الصيانة">
                  <History size={15} />
                </button>
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

      {/* Add Modal & History Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-white tracking-wide">{editing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { key: 'name',         label: 'اسم العميل *' },
                  { key: 'phone',        label: 'رقم الهاتف' },
                  { key: 'nationalId',   label: 'الرقم القومي' },
                  { key: 'carModel',     label: 'موديل العربية' },
                  { key: 'licensePlate', label: 'رقم اللوحة' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-400 text-xs mb-1.5 block font-medium">{f.label}</label>
                    <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input text-sm py-2.5" />
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-slate-800 flex gap-3">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 text-sm py-3">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-1 text-sm py-3 shadow-glow">
                  {editing ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {historyCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                        <Wrench size={20} className="text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg">سجل الصيانة</h2>
                        <p className="text-xs text-slate-400">{historyCustomer.name} - {historyCustomer.carModel}</p>
                    </div>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {customerHistory.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-500">لا يوجد سجل صيانة سابق لهذا العميل</p>
                    </div>
                ) : (
                    customerHistory.map(inv => (
                        <div key={inv.id} className="relative pr-6 border-r-2 border-primary-500/20 last:border-0 pb-2">
                             <div className="absolute right-[-7px] top-0 w-3 h-3 bg-primary-500 rounded-full shadow-glow" />
                             
                             <div className="flex justify-between items-start mb-2 pr-2">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar size={12} className="text-primary-400" />
                                    {new Date(inv.createdAt?.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-0.5 rounded-md border border-white/5 text-slate-300 font-bold">
                                    <FileText size={10} /> {inv.number}
                                </div>
                             </div>

                             <div className="glass-card bg-white/[0.03] border-white/5 p-3 space-y-2">
                                {inv.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-semibold">{item.name}</span>
                                            {item.returnedQty > 0 && <span className="text-rose-400 text-[10px] font-bold">(مرتجع {item.returnedQty})</span>}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-primary-400 font-bold">{item.price?.toLocaleString()} ج.م</p>
                                            <p className="text-[10px] text-slate-500">الكمية: {item.qty}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400">الإجمالي الفاتورة</span>
                                    <span className="text-xs font-bold text-white">{inv.total?.toLocaleString()} ج.م</span>
                                </div>
                             </div>
                        </div>
                    ))
                )}
              </div>
              
              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <button onClick={() => setHistoryCustomer(null)} className="btn-ghost w-full py-3 text-sm">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
