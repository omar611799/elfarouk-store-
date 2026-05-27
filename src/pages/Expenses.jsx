import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, Coffee, Zap, Truck, Users, MoreHorizontal, Wallet, CheckCircle2 } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { id: 'salaries', label: 'رواتب ويوميات', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', active: 'bg-purple-500 border-purple-500 text-white' },
  { id: 'utilities', label: 'كهرباء وغاز', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', active: 'bg-amber-500 border-amber-500 text-white' },
  { id: 'food', label: 'بوفيه وضيافة', icon: Coffee, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200', active: 'bg-primary-500 border-primary-500 text-white' },
  { id: 'transport', label: 'نقل ومواصلات', icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', active: 'bg-sky-500 border-sky-500 text-white' },
  { id: 'tips', label: 'إكرامية وعتالة', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', active: 'bg-emerald-500 border-emerald-500 text-white' },
  { id: 'other', label: 'أخرى (منوعة)', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', active: 'bg-slate-500 border-slate-500 text-white' },
]

const BADGE_COLORS = {
  salaries: 'bg-purple-50 border-purple-200 text-purple-700',
  utilities: 'bg-amber-50 border-amber-200 text-amber-700',
  food: 'bg-primary-50 border-primary-200 text-primary-700',
  transport: 'bg-sky-50 border-sky-200 text-sky-700',
  tips: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  other: 'bg-slate-50 border-slate-200 text-slate-600',
}

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
      await addExpense({ amount: Number(amount), category: categoryId, note })
      setShowAddModal(false)
      setAmount('')
      setNote('')
      setCategoryId('other')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryTheme = (cid) => EXPENSE_CATEGORIES.find(c => c.id === cid) || EXPENSE_CATEGORIES[5]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-sm">
              <Wallet size={20} className="text-rose-500" />
            </div>
            المصروفات اليومية
          </h1>
          <p className="text-slate-500 text-xs mt-1">سجل نفقات المتجر لضبط صافي الأرباح</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-2.5 flex-1 sm:flex-none">
            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">مصروفات الشهر</p>
            <p className="text-lg font-black text-rose-600">{totalCurrentMonth.toLocaleString('en-US')} <span className="text-xs font-normal text-rose-400">ج.م</span></p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary px-5 py-3 flex items-center gap-2 text-sm font-bold flex-1 sm:flex-none rounded-xl">
            <Plus size={16} /> تسجيل مصروف
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        <h2 className="font-black text-slate-700 text-base flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          سجل المصروفات
        </h2>

        {expenses.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-20">
            <Wallet size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">لا توجد أي مصروفات مُسجلة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(ex => {
              const theme = getCategoryTheme(ex.category)
              const date = ex.createdAt?.toDate ? ex.createdAt.toDate() : new Date(ex.createdAt)
              const badgeClass = BADGE_COLORS[ex.category] || BADGE_COLORS.other
              
              return (
                <div key={ex.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-slate-300 hover:shadow-sm gap-4 group transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${theme.bg}`}>
                      <theme.icon size={20} className={theme.color} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg leading-tight">{Number(ex.amount).toLocaleString('en-US')} <span className="text-xs text-slate-400 font-normal">ج.م</span></p>
                      <p className="text-sm text-slate-500 mt-0.5">{ex.note || 'بدون وصف'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-1 rounded-lg font-bold border ${badgeClass}`}>
                        {theme.label}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">{date.toLocaleDateString('en-GB')}</p>
                    </div>
                    <button 
                      onClick={() => { if (confirm('هل أنت متأكد من مسح هذا المصروف؟')) deleteExpense(ex.id) }}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
              onClick={() => setShowAddModal(false)} 
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: '100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="bg-white relative z-10 w-full max-w-lg overflow-hidden rounded-t-[2.5rem] sm:rounded-3xl border border-slate-200 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden" onClick={() => setShowAddModal(false)} />
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-800">تسجيل مصروف جديد</h2>
              </div>
              
              <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">المبلغ (ج.م)*</label>
                  <input 
                    type="number" required autoFocus
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-rose-200 rounded-xl px-4 py-3 text-2xl font-black text-rose-600 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">نوع المصروف*</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id} type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`p-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-wide flex flex-col items-center gap-2 transition-all ${
                          categoryId === cat.id 
                            ? cat.active + ' shadow-md' 
                            : `${cat.bg} ${cat.color} hover:shadow-sm`
                        }`}
                      >
                        <cat.icon size={20} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">الوصف (إختياري)</label>
                  <input 
                    type="text" 
                    value={note} onChange={e => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    placeholder="مثل: صيانة، ضيافة، هدايا..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold transition-colors flex-1">إلغاء</button>
                  <button type="submit" disabled={!amount || saving} className="bg-rose-500 hover:bg-rose-600 text-white flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-sm">
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
