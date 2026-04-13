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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">المصروفات اليومية</h1>
          <p className="text-slate-400 text-sm mt-1">سجل نفقات المتجر لضبط صافي الأرباح بدقة</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-6 py-3 border-rose-500/30 bg-rose-500/5">
            <p className="text-slate-400 text-xs font-bold mb-1">مصروفات الشهر الحالي</p>
            <p className="text-2xl font-bold text-rose-400">{totalCurrentMonth.toLocaleString()} ج.م</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary h-full py-4 flex items-center gap-2">
            <Plus size={20} /> تسجيل مصروف
          </button>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary-400" />
          سجل المصروفات
        </h2>

        {expenses.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد أي مصروفات مُسجلة حتى الآن.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(ex => {
              const theme = getCategoryTheme(ex.category)
              const date = ex.createdAt?.toDate ? ex.createdAt.toDate() : new Date(ex.createdAt)
              
              return (
                <div key={ex.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] p-4 rounded-xl border border-white/5 gap-4 group transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme.bg}`}>
                      <theme.icon size={20} className={theme.color} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{Number(ex.amount).toLocaleString()} ج.م</p>
                      <p className="text-slate-400 text-sm mt-0.5">{ex.note || 'بدون وصف'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${theme.bg} ${theme.color}`}>
                        {theme.label}
                      </span>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {date.toLocaleDateString('ar-EG')} • {date.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح هذا المصروف؟')) deleteExpense(ex.id)
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card relative z-10 w-full max-w-lg p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] pointer-events-none" />
            
            <h2 className="text-xl font-bold text-white mb-6">تسجيل مصروف جديد</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">المبلغ (ج.م)*</label>
                <input 
                  type="number" required autoFocus
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="input w-full text-lg font-bold text-rose-400 placeholder:text-slate-600 border-rose-500/30 focus:border-rose-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">نوع المصروف*</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id} type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all
                        ${categoryId === cat.id 
                          ? `${cat.bg} border-${cat.color.split('-')[1]}-500 shadow-glow` 
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'
                        }`}
                    >
                      <cat.icon size={20} className={categoryId === cat.id ? cat.color : 'text-slate-500'} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">الوصف (إختياري)</label>
                <input 
                  type="text" 
                  value={note} onChange={e => setNote(e.target.value)}
                  className="input w-full"
                  placeholder="مثال: إكرامية عمال نقل العفشة..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5 mt-6">
                <button type="submit" disabled={!amount || saving} className="btn-primary flex-1 flex items-center justify-center gap-2 !bg-rose-600 hover:!bg-rose-700">
                  <CheckCircle2 size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ وتسجيل'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost px-6">إلغاء</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
