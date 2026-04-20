import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, Coffee, Zap, Truck, Users, MoreHorizontal, Wallet, CheckCircle2 } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { id: 'salaries', label: 'رواتب ويوميات', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'utilities', label: 'كهرباء وغاز', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'food', label: 'بوفيه وضيافة', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'transport', label: 'نقل ومواصلات', icon: Truck, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { id: 'tips', label: 'إكرامية وعتالة', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'other', label: 'أخرى (منوعة)', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
]

export default function Expenses() {
  const { expenses, addExpense, deleteExpense } = useStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('other')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const currentMonthExpenses = useMemo(() => {
    const d = new Date()
    return expenses.filter(ex => {
      const exDate = ex.createdAt?.toDate?.() || new Date(ex.createdAt)
      return exDate.getMonth() === d.getMonth() && exDate.getFullYear() === d.getFullYear()
    })
  }, [expenses])

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || amount <= 0) return
    
    setSaving(true)
    try {
      await addExpense({
        amount: Number(amount),
        category: categoryId,
        note,
      })
      setShowAddModal(false)
      setAmount('')
      setNote('')
      setCategoryId('other')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryTheme = (cid) => {
    return EXPENSE_CATEGORIES.find(c => c.id === cid) || EXPENSE_CATEGORIES[5]
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center shadow-lg">
                <Wallet size={20} className="text-rose-400" />
            </div>
            المصروفات اليومية
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">سجل نفقات المتجر لضبط صافي الأرباح</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="card !py-2 !px-4 border-rose-500/10 bg-rose-500/[0.02] flex-1 sm:flex-none">
            <p className="text-slate-600 text-[7px] font-black uppercase tracking-widest leading-none mb-1">مصروفات الشهر</p>
            <p className="text-base sm:text-lg font-black text-rose-500 font-display leading-none">{totalCurrentMonth.toLocaleString('en-US')} <span className="text-[9px] font-normal opacity-50">ج.م</span></p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary !px-4 sm:!px-6 !py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none">
            <Plus size={16} /> تسجيل مصروف
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 px-1">
        <h2 className="font-black text-white text-base sm:text-lg flex items-center gap-2 px-1 uppercase tracking-tight font-display">
          <Calendar size={16} className="text-electric-400" />
          سجل المصروفات
        </h2>

        {expenses.length === 0 ? (
          <div className="text-center py-20 card border-dashed border-white/5 opacity-30">
            <Wallet size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">لا توجد أي مصروفات مُسجلة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(ex => {
              const theme = getCategoryTheme(ex.category)
              const date = ex.createdAt?.toDate ? ex.createdAt.toDate() : new Date(ex.createdAt)
              
              return (
                <div key={ex.id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-white/10 gap-4 group transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme.bg} shrink-0`}>
                      <theme.icon size={20} className={theme.color} />
                    </div>
                    <div className="min-w-0 pr-2">
                        <p className="font-black text-white text-base sm:text-lg font-display tracking-tight leading-tight">{Number(ex.amount).toLocaleString('en-US')} <span className="text-[10px] text-slate-500 font-normal">ج.م</span></p>
                        <p className="text-[10px] sm:text-sm text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{ex.note || 'بدون وصف'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className="text-right sm:text-left flex items-center sm:flex-col gap-2 sm:gap-1.5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border shrink-0 ${theme.bg} ${theme.color}`}>
                        {theme.label}
                      </span>
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                        {date.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح هذا المصروف؟')) deleteExpense(ex.id)
                      }}
                      className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-xl" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="card !p-0 relative z-10 w-full max-w-lg overflow-hidden rounded-t-[2.5rem] sm:rounded-3xl border-white/10 shadow-premium">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden" onClick={() => setShowAddModal(false)} />
              <div className="p-6 sm:p-8 border-b border-white/5">
                <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight uppercase">تسجيل مصروف جديد</h2>
              </div>
              
              <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">المبلغ (ج.م)*</label>
                  <input 
                    type="number" required autoFocus
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="input w-full text-2xl font-black text-rose-500 placeholder:text-slate-800 border-rose-500/10 focus:border-rose-500 font-display"
                    placeholder="0.00"
                  />
                </div>

                <div className="px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">نوع المصروف*</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id} type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`p-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2.5 transition-all
                          ${categoryId === cat.id 
                            ? `${cat.bg} border-${cat.color.split('-')[1]}-500 shadow-lg shadow-${cat.color.split('-')[1]}-500/10` 
                            : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05]'
                          }`}
                      >
                        <cat.icon size={20} className={categoryId === cat.id ? cat.color : 'text-slate-600'} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">الوصف (إختياري)</label>
                  <input 
                    type="text" 
                    value={note} onChange={e => setNote(e.target.value)}
                    className="input w-full text-sm"
                    placeholder="مثل: صيانة، ضيافة، هدايا..."
                  />
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/5 mt-8 pb-safe">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost px-6 flex-1 py-3 text-[10px] font-black uppercase tracking-widest">إلغاء</button>
                  <button type="submit" disabled={!amount || saving} className="btn-primary flex-[2] flex items-center justify-center gap-2 !bg-rose-500 hover:!bg-rose-600 shadow-rose-500/20 py-3 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ وتسجيل'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
