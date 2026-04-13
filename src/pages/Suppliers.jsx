import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Truck, History, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EMPTY = { name: '', phone: '', address: '', notes: '' }

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, purchases, transactions, paySupplierDebt } = useStore()
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  
  const [historySupplier, setHistorySupplier] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [savingPay, setSavingPay] = useState(false)

  const supplierHistory = useMemo(() => {
    if (!historySupplier) return []
    const sPurchases = purchases.filter(p => p.supplierId === historySupplier.id)
    const sPayments = transactions.filter(t => t.type === 'supplier_payment' && t.refId === historySupplier.id)
    
    return [...sPurchases.map(p => ({ ...p, type: 'purchase' })), ...sPayments.map(p => ({ ...p, type: 'payment' }))]
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })
  }, [historySupplier, purchases, transactions])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (s) => { setEditing(s.id); setForm({ ...EMPTY, ...s }); setModal(true) }

  const handleSubmit = async () => {
    if (!form.name) return
    if (editing) await updateSupplier(editing, form)
    else await addSupplier(form)
    setModal(false)
  }

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) return
    setSavingPay(true)
    try {
        await paySupplierDebt(payModal.id, payAmount, payNote)
        setPayModal(null)
        setPayAmount('')
        setPayNote('')
    } finally {
        setSavingPay(false)
    }
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
              <div className="flex items-center gap-2">
                {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
                {s.debtTotal > 0 && <span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded border border-red-500/20 font-bold">مديونية: {s.debtTotal.toLocaleString()}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setHistorySupplier(s)} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="سجل المشتريات">
                <History size={15} />
              </button>
              {s.debtTotal > 0 && (
                  <button onClick={() => setPayModal(s)} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="سداد مديونية">
                    <DollarSign size={15} />
                  </button>
              )}
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

      {/* Modals & AnimatePresence */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-white tracking-wide">{editing ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { key: 'name',    label: 'اسم الشركة / المورد *' },
                  { key: 'phone',   label: 'رقم الهاتف' },
                  { key: 'address', label: 'العنوان' },
                  { key: 'notes',   label: 'ملاحظات' },
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
                  {editing ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* History Modal */}
        {historySupplier && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                        <Truck size={20} className="text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg">سجل المورد</h2>
                        <p className="text-xs text-slate-400">{historySupplier.name}</p>
                    </div>
                </div>
                <button onClick={() => setHistorySupplier(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {supplierHistory.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-500 text-sm">لا يوجد تاريخ تعاملات مع هذا المورد</p>
                    </div>
                ) : (
                    supplierHistory.map((item, idx) => (
                        <div key={idx} className={`relative pr-6 border-r-2 ${item.type === 'purchase' ? 'border-primary-500/20' : 'border-emerald-500/20'} last:border-0 pb-2`}>
                             <div className={`absolute right-[-7px] top-0 w-3 h-3 ${item.type === 'purchase' ? 'bg-primary-500' : 'bg-emerald-500'} rounded-full shadow-glow`} />
                             
                             <div className="flex justify-between items-center mb-2 pr-2">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <Calendar size={12} className={item.type === 'purchase' ? 'text-primary-400' : 'text-emerald-400'} />
                                    {new Date(item.createdAt?.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${item.type === 'purchase' ? 'bg-primary-500/5 text-primary-400 border-primary-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'}`}>
                                    {item.type === 'purchase' ? 'فاتورة توريد' : 'سداد قسط'}
                                </div>
                             </div>

                             <div className="glass-card bg-white/[0.03] border-white/5 p-3 space-y-2">
                                {item.type === 'purchase' ? (
                                    <>
                                        <p className="text-xs text-white font-bold mb-2 flex items-center gap-2"><FileText size={12}/> فاتورة #{item.billNumber}</p>
                                        {item.items?.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-300">{p.name} (x{p.qty})</span>
                                                <span className="text-white">{(p.cost * p.qty).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-white/5 pt-2 mt-2 flex justify-between font-bold text-xs uppercase">
                                            <span className="text-slate-400">إجمالي الفاتورة:</span>
                                            <span className="text-primary-400">{item.total?.toLocaleString()} ج.م</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                            <div>
                                                <p className="text-xs text-white font-bold">دفعة نقدية مسددة للمورد</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{item.details}</p>
                                            </div>
                                        </div>
                                        <p className="text-emerald-400 font-bold text-sm">{(Math.abs(item.amount)).toLocaleString()} ج.م</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    ))
                )}
              </div>
              
              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <button onClick={() => setHistorySupplier(null)} className="btn-ghost w-full py-3 text-sm">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Pay Modal */}
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }} className="bg-slate-900 border border-emerald-500/20 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="p-6 text-center border-b border-white/5">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <DollarSign size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">تسجيل سداد دفعة</h2>
                    <p className="text-xs text-slate-400">للمورد: <span className="text-emerald-400 font-bold">{payModal.name}</span></p>
                    <p className="text-xs text-rose-400 mt-2 font-bold bg-rose-500/5 inline-block px-3 py-1 rounded-full border border-rose-500/10">إجمالي المديونية الحالية: {payModal.debtTotal?.toLocaleString()} ج.م</p>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5 mr-1">المبلغ المراد سداده:</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute right-3 top-3 text-emerald-400" />
                            <input 
                                type="number" 
                                value={payAmount} 
                                onChange={e => setPayAmount(e.target.value)} 
                                placeholder="0" 
                                className="input text-lg font-bold text-emerald-400 pr-10 border-emerald-500/20 focus:border-emerald-500 text-center"
                            />
                        </div>
                    </div>
                    <input 
                        value={payNote} 
                        onChange={e => setPayNote(e.target.value)} 
                        placeholder="ملاحظات (اختياري)..." 
                        className="input text-xs py-2.5" 
                    />
                </div>
                
                <div className="p-6 flex gap-3 bg-white/[0.01]">
                    <button onClick={() => setPayModal(null)} className="flex-1 btn-ghost text-sm py-3">إلغاء</button>
                    <button 
                        onClick={handlePay}
                        disabled={savingPay || !payAmount}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl shadow-glow transition-all active:scale-95 disabled:opacity-50"
                    >
                        {savingPay ? 'جاري السداد...' : 'تأكيد السداد'}
                    </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
