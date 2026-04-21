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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-primary-500/5">
                    <Users size={20} className="text-primary-400" />
                </div>
                قاعدة بيانات العملاء
            </h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي المسجلين: {customers.length}</p>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="btn-primary !px-4 sm:!px-6 !py-2.5 sm:!py-3 text-[10px] sm:text-sm">
          <Plus size={16} /> إضافة عميل جديد
        </motion.button>
      </div>

      <div className="relative group px-1">
        <Search size={16} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، رقم الهاتف..." className="input pr-10 sm:pr-12 text-sm" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-2.5 sm:gap-4 px-1">
        {filtered.map(c => (
          <motion.div variants={itemVariant} layout key={c.id} className="card !py-3 !px-4 sm:!py-6 sm:!px-8 hover:border-primary-500/30 group flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-obsidian-950 border border-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-500 shadow-xl">
                <Users size={20} className="text-primary-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 min-w-0 text-right">
                <p className="font-black text-white text-sm sm:text-lg tracking-tight group-hover:text-primary-400 transition-colors font-display truncate leading-tight">{c.name}</p>
                <div className="flex items-center gap-3 mt-1">
                    {c.phone && <span className="text-[7px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none flex items-center gap-1"><Phone size={8} className="text-emerald-500" /> {c.phone}</span>}
                    {c.carModel && <span className="text-[7px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none flex items-center gap-1"><Car size={8} className="text-primary-400" /> {c.carModel}</span>}
                </div>
              </div>

              <div className="sm:hidden text-left shrink-0">
                  <p className="text-sm font-black text-white font-display leading-none mb-1">{Number(c.totalSpent || 0).toLocaleString('en-US')}</p>
                  <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest leading-none text-left">ج.م</p>
              </div>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-2 border-t border-white/5 pt-3 sm:pt-0 sm:border-0 mt-1 sm:mt-0">
              <div className="flex-1 sm:hidden">
                  {c.debtTotal > 0 && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/10 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter">ديون: {Number(c.debtTotal).toLocaleString('en-US')} ج</span>}
              </div>

              <div className="sm:px-6 2xl:px-10 py-1 border-x border-white/5 hidden sm:flex flex-col items-center justify-center min-w-[140px]">
                <p className="text-lg 2xl:text-xl font-black text-white font-display tracking-tight leading-none mb-1">{Number(c.totalSpent || 0).toLocaleString('en-US')} <span className="text-[9px] text-slate-500 font-normal">ج.م</span></p>
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest text-center uppercase">Total Spent</span>
                {c.debtTotal > 0 && <span className="badge-red mt-2 !text-[8px] !px-2 font-black tracking-tighter">مديونية: {Number(c.debtTotal).toLocaleString('en-US')}</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setHistoryCustomer(c)} className="p-2.5 bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all active:scale-95" title="سجل الصيانة">
                  <History size={14} />
                </button>
                <button onClick={() => openEdit(c)} className="p-2.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if(window.confirm('حذف العميل؟')) deleteCustomer(c.id) }} className="p-2.5 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-20 border-dashed border-white/5 opacity-30">
            <Users size={50} className="text-slate-500 mx-auto mb-6" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">لم يتم العثور على عملاء بهذا البحث</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-obsidian-900 w-full max-w-xl border-t sm:border border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem]">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 sm:hidden" />
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">{editing ? 'تعديل البيانات' : 'إضافة عميل جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {[
                  { key: 'name',         label: 'اسم العميل المزدة *', placeholder: 'مثلاً: محمد علي' },
                  { key: 'phone',        label: 'رقم الهاتف / الواتساب', placeholder: '01xxxxxxxxx' },
                  { key: 'nationalId',   label: 'الرقم القومي (اختياري)', placeholder: '29xxxxxxxxxxxx' },
                  { key: 'carModel',     label: 'نوع السيارة والموديل', placeholder: 'لانسر بومة 2008' },
                  { key: 'licensePlate', label: 'رقم لوحة السيارة', placeholder: 'أ ب ج 123' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 block">{f.label}</label>
                    <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input text-sm" placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <div className="p-6 sm:p-8 border-t border-white/5 flex gap-4 bg-obsidian-950/50">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 py-4 text-[10px] font-black uppercase tracking-widest">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-[2] py-4 text-[10px] font-black uppercase tracking-widest shadow-neon">
                  {editing ? 'حفظ التغييرات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {historyCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-xl z-[100] flex items-baseline sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="card !p-0 w-full max-w-2xl border-white/10 shadow-premium flex flex-col h-[90vh] sm:h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden" onClick={() => setHistoryCustomer(null)} />
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/5 shadow-lg shadow-primary-500/5">
                        <Wrench size={20} className="text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-black text-white text-lg sm:text-xl font-display">سجل صيانة العميل</h2>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5 sm:mt-1">{historyCustomer.name}</p>
                    </div>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scrollbar-hide pb-32">
                {customerHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs">لا يوجد صيانة مسجلة حالياً</p>
                    </div>
                ) : (
                    customerHistory.map((inv, idx) => (
                        <div key={inv.id} className="relative pr-6 sm:pr-8 border-r-2 border-white/5 pb-2">
                             <div className="absolute right-[-5px] top-0 w-2 h-2 bg-primary-500 rounded-full shadow-lg shadow-primary-500/5" />
                             
                             <div className="flex justify-between items-center mb-3 sm:mb-4 pr-3 sm:pr-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="bg-white/5 p-1.5 rounded-lg text-slate-400">
                                        <Calendar size={12} />
                                    </div>
                                    <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                                        {(inv.createdAt?.toDate?.() || new Date(inv.createdAt)).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                                <div className="badge-primary !bg-white/5 !border-white/5 !text-[7px] sm:!text-[8px] tracking-tighter">رقم {inv.number}</div>
                             </div>

                             <div className="glass-card !p-3 sm:!p-5 !rounded-2xl sm:!rounded-3xl border-white/[0.03] space-y-3 sm:space-y-4">
                                {inv.items?.map((item, iIdx) => (
                                    <div key={iIdx} className="flex justify-between items-center bg-black/20 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/[0.02]">
                                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                                            <span className="text-slate-100 text-xs sm:text-sm font-black font-display truncate">{item.name}</span>
                                            {item.returnedQty > 0 && <span className="badge-red !py-0.5 !px-2 mt-1 !text-[7px] w-fit">مرتجع: {item.returnedQty}</span>}
                                        </div>
                                        <div className="text-left flex flex-col items-end shrink-0">
                                            <p className="text-primary-400 font-black font-display text-xs sm:text-sm">{item.price?.toLocaleString('en-US')} ج.م</p>
                                            <p className="text-[8px] lg:text-[9px] text-slate-600 font-black uppercase mt-0.5">الكمية: {item.qty}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-white/5 flex justify-between items-center px-1 sm:px-2">
                                    <span className="text-[9px] sm:text-[10px] text-slate-600 font-black uppercase tracking-widest">إجمالي الفاتورة</span>
                                    <span className="text-xs sm:text-sm font-black text-white font-display tracking-tight">{inv.total?.toLocaleString('en-US')} ج.م</span>
                                </div>
                             </div>
                        </div>
                    ))
                )}
              </div>
              
              <div className="p-6 sm:p-8 border-t border-white/5 bg-obsidian-950/80 absolute bottom-0 left-0 right-0 backdrop-blur-3xl">
                <button onClick={() => setHistoryCustomer(null)} className="btn-ghost w-full py-3 text-[10px] font-black uppercase tracking-widest pb-safe">إغلاق السجل</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

  )
}
