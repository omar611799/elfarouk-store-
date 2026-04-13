import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Users, Phone, Car, History, Wrench, Calendar, FileText, Search, X, Sparkles, CreditCard, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EMPTY = { name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' }

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, invoices } = useStore()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [historyCustomer, setHistoryCustomer] = useState(null)

  const customerHistory = useMemo(() => {
    if (!historyCustomer) return []
    return invoices
      .filter(i => 
        (historyCustomer.phone && i.customerData?.phone === historyCustomer.phone) || 
        (!historyCustomer.phone && i.customerData?.name === historyCustomer.name)
      )
      .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
      })
  }, [historyCustomer, invoices])

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                    <Users size={22} className="text-electric-400" />
                </div>
                قاعدة بيانات العملاء
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي المسجلين: {customers.length}</p>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="btn-primary">
          <Plus size={18} /> إضافة عميل جديد
        </motion.button>
      </div>

      <div className="relative group">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، رقم الهاتف..." className="input pr-12 text-sm" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
        {filtered.map(c => (
          <motion.div variants={itemVariant} layout key={c.id} className="card !py-6 !px-8 hover:border-electric-500/30 group flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-obsidian-950 border border-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-500 shadow-xl">
              <Users size={24} className="text-electric-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex-1 min-w-0 md:text-right text-center">
              <p className="font-black text-white text-lg tracking-tight group-hover:text-electric-400 transition-colors font-display leading-none mb-3">{c.name}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                {c.phone && (
                  <span className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {c.phone}
                  </span>
                )}
                {c.carModel && (
                  <span className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-electric-500" /> {c.carModel}
                  </span>
                )}
                 {c.licensePlate && (
                  <span className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest border border-white/5 bg-white/5 px-2 py-0.5 rounded-md">
                    {c.licensePlate}
                  </span>
                )}
              </div>
            </div>

            <div className="md:px-10 py-2 border-x border-white/5 hidden md:flex flex-col items-center justify-center min-w-[150px]">
              <p className="text-xl font-black text-white font-display tracking-tight leading-none mb-1">{Number(c.totalSpent || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-500 font-normal">ج.م</span></p>
              <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">إجمالي المشتريات</span>
              {c.debtTotal > 0 && <span className="badge-red mt-2 !text-[9px] !px-3 font-black tracking-tighter">مديونية: {Number(c.debtTotal).toLocaleString('en-US')}</span>}
            </div>

            <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-all">
              <button onClick={() => setHistoryCustomer(c)} className="p-3 bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-2xl transition-all" title="سجل الصيانة">
                <History size={18} />
              </button>
              <button onClick={() => openEdit(c)} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                <Edit2 size={18} />
              </button>
              <button onClick={() => deleteCustomer(c.id)} className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-20 border-dashed border-white/5 opacity-30">
            <Users size={60} className="text-slate-500 mx-auto mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-widest">لم يتم العثور على عملاء بهذا البحث</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="card !p-0 w-full max-w-xl border-white/10 shadow-premium">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white font-display tracking-tight">{editing ? 'تعديل البيانات' : 'إضافة عميل جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                {[
                  { key: 'name',         label: 'اسم العميل المزدة *' },
                  { key: 'phone',        label: 'رقم الهاتف / الواتساب' },
                  { key: 'nationalId',   label: 'الرقم القومي (اختياري)' },
                  { key: 'carModel',     label: 'نوع السيارة والموديل' },
                  { key: 'licensePlate', label: 'رقم لوحة السيارة' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">{f.label}</label>
                    <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                  </div>
                ))}
              </div>
              <div className="p-8 border-t border-white/5 flex gap-4">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2]">
                  {editing ? 'حفظ التغييرات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {historyCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <motion.div initial={{ y: 50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.9, opacity: 0 }} className="card !p-0 w-full max-w-2xl border-white/10 shadow-premium flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-electric-500/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-neon">
                        <Wrench size={24} className="text-electric-400" />
                    </div>
                    <div>
                        <h2 className="font-black text-white text-xl font-display">سجل صيانة العميل</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{historyCustomer.name} • {historyCustomer.carModel}</p>
                    </div>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none custom-scrollbar pb-32">
                {customerHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">لا يوجد صيانة مسجلة حالياً</p>
                    </div>
                ) : (
                    customerHistory.map((inv, idx) => (
                        <div key={inv.id} className="relative pr-8 border-r-2 border-white/5 pb-2">
                             <div className="absolute right-[-5px] top-0 w-2 h-2 bg-electric-500 rounded-full shadow-neon" />
                             
                             <div className="flex justify-between items-center mb-4 pr-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/5 p-2 rounded-xl text-slate-400">
                                        <Calendar size={14} />
                                    </div>
                                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">
                                        {(inv.createdAt?.toDate?.() || new Date(inv.createdAt)).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="badge-blue !bg-obsidian-900/50 !text-[8px] tracking-tighter">رقم {inv.number}</div>
                             </div>

                             <div className="glass-card !p-5 !rounded-3xl border-white/[0.03] space-y-4">
                                {inv.items?.map((item, iIdx) => (
                                    <div key={iIdx} className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/[0.02]">
                                        <div className="flex flex-col">
                                            <span className="text-slate-100 text-sm font-black font-display">{item.name}</span>
                                            {item.returnedQty > 0 && <span className="badge-red !py-0.5 !px-2 mt-1 !text-[7px]">مرتجع: {item.returnedQty}</span>}
                                        </div>
                                        <div className="text-left flex flex-col items-end">
                                            <p className="text-electric-400 font-black font-display text-sm">{item.price?.toLocaleString('en-US')} ج.م</p>
                                            <p className="text-[9px] text-slate-600 font-black uppercase mt-1">الكمية: {item.qty}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-center px-2">
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">إجمالي الفاتورة</span>
                                    <span className="text-sm font-black text-white font-display tracking-tight">{inv.total?.toLocaleString('en-US')} ج.م</span>
                                </div>
                             </div>
                        </div>
                    ))
                )}
              </div>
              
              <div className="p-8 border-t border-white/5 bg-obsidian-950/50 absolute bottom-0 left-0 right-0 backdrop-blur-3xl">
                <button onClick={() => setHistoryCustomer(null)} className="btn-ghost w-full">إغلاق السجل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
