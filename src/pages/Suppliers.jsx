import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Edit2, Trash2, Truck, History, DollarSign, Calendar, FileText, CheckCircle2, X } from 'lucide-react'
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Truck size={20} className="text-primary-600" />
            </span>
            الموردين وتوريد البضائع
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-1 mr-13">
            إجمالي المسجلين: <span className="text-primary-600 font-black">{suppliers.length}</span>
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary !rounded-xl">
          <Plus size={16} /> إضافة مورد جديد
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="card flex flex-col justify-between !p-0 overflow-hidden hover:border-primary-200 group">
            <div className="flex items-center gap-4 px-5 py-5 border-b border-slate-100">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-100 group-hover:scale-105 transition-transform">
                <Truck size={20} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-base truncate">{s.name}</p>
                {s.phone && <p className="text-xs text-slate-400 font-bold mt-1">{s.phone}</p>}
              </div>
            </div>
            
            <div className="px-5 py-4 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">المديونية المستحقة</p>
                <p className={`text-lg font-black ${s.debtTotal > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {Number(s.debtTotal || 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                </p>
              </div>
              {s.debtTotal > 0 && (
                <span className="bg-rose-50 text-rose-600 text-[10px] px-2.5 py-1 rounded-md border border-rose-100 font-black animate-pulse">
                  معلق دفع
                </span>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div className="flex gap-1">
                <button onClick={() => setHistorySupplier(s)} 
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" 
                  title="سجل المشتريات">
                  <History size={16} />
                </button>
                {s.debtTotal > 0 && (
                  <button onClick={() => setPayModal(s)} 
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                    title="سداد مديونية">
                    <DollarSign size={16} />
                  </button>
                )}
                <button onClick={() => openEdit(s)} 
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => { if(window.confirm('هل تريد حذف هذا المورد؟')) deleteSupplier(s.id) }} 
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              {s.address && <span className="text-[9px] font-black text-slate-400 truncate max-w-[120px]">{s.address}</span>}
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="card text-center py-20 border-dashed col-span-full">
            <Truck size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-bold">لا يوجد موردين بعد</p>
          </div>
        )}
      </div>

      {/* Modals & AnimatePresence */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setModal(false)}
          >
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="bg-white w-full max-w-md shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden text-right"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 sm:hidden" />
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800">{editing ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name',    label: 'اسم الشركة / المورد *' },
                  { key: 'phone',   label: 'رقم الهاتف' },
                  { key: 'address', label: 'العنوان' },
                  { key: 'notes',   label: 'ملاحظات' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-500 text-[10px] mb-1.5 block font-bold uppercase tracking-wider">{f.label}</label>
                    <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input text-sm !rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 text-sm py-3 !rounded-xl">إلغاء</button>
                <button onClick={handleSubmit} className="btn-primary flex-1 text-sm py-3 !rounded-xl">
                  {editing ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* History Modal */}
        {historySupplier && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-baseline sm:items-center justify-center p-0 sm:p-6 overflow-hidden"
            onClick={() => setHistorySupplier(null)}
          >
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="bg-white border border-slate-100 rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden text-right"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                    <Truck size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">سجل المورد</h2>
                    <p className="text-xs text-slate-400 font-bold">{historySupplier.name}</p>
                  </div>
                </div>
                <button onClick={() => setHistorySupplier(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
                {supplierHistory.length === 0 ? (
                  <div className="text-center py-20 opacity-40">
                    <p className="text-slate-400 font-bold text-sm">لا يوجد تاريخ تعاملات مع هذا المورد</p>
                  </div>
                ) : (
                  supplierHistory.map((item, idx) => (
                    <div key={idx} className={`relative pr-6 border-r-2 ${item.type === 'purchase' ? 'border-primary-200' : 'border-emerald-200'} last:border-0 pb-2`}>
                      <div className={`absolute right-[-7px] top-0 w-3 h-3 ${item.type === 'purchase' ? 'bg-primary-500' : 'bg-emerald-500'} rounded-full`} />
                      
                      <div className="flex justify-between items-center mb-2 pr-2">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Calendar size={12} className={item.type === 'purchase' ? 'text-primary-500' : 'text-emerald-500'} />
                          {new Date(item.createdAt?.seconds * 1000).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className={`text-[10px] px-2.5 py-0.5 rounded-md border font-black ${item.type === 'purchase' ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {item.type === 'purchase' ? 'فاتورة توريد' : 'سداد قسط'}
                        </div>
                      </div>

                      <div className="glass-card bg-slate-50/50 border-slate-100 p-4 space-y-3">
                        {item.type === 'purchase' ? (
                          <>
                            <p className="text-xs text-slate-800 font-black mb-2 flex items-center gap-2"><FileText size={12} className="text-slate-500" /> فاتورة #{item.billNumber}</p>
                            {item.items?.map((p, i) => (
                              <div key={i} className="flex justify-between items-center text-xs font-bold py-1 border-b border-slate-100/50 last:border-0">
                                <span className="text-slate-600">{p.name} (x{p.qty})</span>
                                <span className="text-slate-900 font-display">{(p.cost * p.qty).toLocaleString('en-US')} ج</span>
                              </div>
                            ))}
                            <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between font-black text-sm uppercase">
                              <span className="text-slate-500">إجمالي الفاتورة:</span>
                              <span className="text-primary-600 font-display">{item.total?.toLocaleString('en-US')} ج.م</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <div>
                                <p className="text-xs text-slate-800 font-black">دفعة نقدية مسددة للمورد</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{item.details}</p>
                              </div>
                            </div>
                            <p className="text-emerald-600 font-black text-sm font-display">{(Math.abs(item.amount)).toLocaleString('en-US')} ج.م</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/80">
                <button onClick={() => setHistorySupplier(null)} className="btn-ghost w-full py-3 text-sm !rounded-xl">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Pay Modal */}
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setPayModal(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white border border-slate-100 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-right"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-1">تسجيل سداد دفعة</h2>
                <p className="text-xs text-slate-400 font-bold">للمورد: <span className="text-emerald-600">{payModal.name}</span></p>
                <p className="text-xs text-rose-600 mt-2 font-black bg-rose-50 inline-block px-3 py-1 rounded-full border border-rose-100">
                  إجمالي المديونية الحالية: {payModal.debtTotal?.toLocaleString('en-US')} ج.م
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black block mb-1.5 mr-1">المبلغ المراد سداده:</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      value={payAmount} 
                      onChange={e => setPayAmount(e.target.value)} 
                      placeholder="0" 
                      className="input text-lg font-black text-slate-800 pr-10 border-slate-200 focus:border-primary-500 text-center !rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black block mb-1.5 mr-1">ملاحظات السداد:</label>
                  <input 
                    value={payNote} 
                    onChange={e => setPayNote(e.target.value)} 
                    placeholder="ملاحظات (اختياري)..." 
                    className="input text-xs py-2.5 !rounded-xl" 
                  />
                </div>
              </div>
              
              <div className="p-6 flex gap-3 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setPayModal(null)} className="flex-1 btn-ghost text-sm py-3 !rounded-xl">إلغاء</button>
                <button 
                  onClick={handlePay}
                  disabled={savingPay || !payAmount}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {savingPay ? 'جاري السداد...' : 'تأكيد السداد'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
