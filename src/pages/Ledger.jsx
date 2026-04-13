import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserMinus, ChevronDown, CheckCircle2, Banknote, Calendar, Receipt } from 'lucide-react'

export default function Ledger() {
  const { invoices, payInvoiceDebt } = useStore()
  const [search, setSearch] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  
  const [paymentModal, setPaymentModal] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter invoices that are not fully paid
  const unpaidInvoices = useMemo(() => {
    return invoices.filter(inv => inv.dueAmount > 0)
  }, [invoices])

  // Group by customer phone (fallback to name)
  const grouped = useMemo(() => {
    const groups = {}
    unpaidInvoices.forEach(inv => {
      const gId = inv.customerData?.phone || inv.customerData?.name || 'غير معروف'
      if (!groups[gId]) {
        groups[gId] = {
          id: gId,
          name: inv.customerData?.name || 'غير معروف',
          phone: inv.customerData?.phone || '',
          totalDebt: 0,
          invoices: []
        }
      }
      groups[gId].totalDebt += inv.dueAmount || 0
      groups[gId].invoices.push(inv)
    })
    
    // Convert to array and filter by search
    return Object.values(groups).filter(g => 
      !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
    ).sort((a, b) => b.totalDebt - a.totalDebt) // Sort by highest debt
  }, [unpaidInvoices, search])

  const totalMarketDebt = grouped.reduce((sum, g) => sum + g.totalDebt, 0)

  const handlePay = async () => {
    if (!paymentModal || !payAmount || isNaN(payAmount)) return
    const amount = Number(payAmount)
    if (amount <= 0 || amount > paymentModal.dueAmount) return
    
    setSaving(true)
    try {
      await payInvoiceDebt(paymentModal.id, amount, 'سداد من دفتر المديونيات')
      setPaymentModal(null)
      setPayAmount('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">دفتر المديونيات وكشف الحساب</h1>
          <p className="text-slate-400 text-sm mt-1">تتبع الديون الآجلة للعملاء وقم بتحصيلها بسهولة</p>
        </div>
        <div className="glass-card px-6 py-3 border-rose-500/30 bg-rose-500/5">
          <p className="text-slate-400 text-xs font-bold mb-1">إجمالي ديون السوق الآجلة</p>
          <p className="text-2xl font-bold text-rose-400">{totalMarketDebt.toLocaleString()} ج.م</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم العميل أو رقم الهاتف..." 
          className="input pr-12 w-full"
        />
      </div>

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="glass-card py-16 text-center border-dashed">
            <UserMinus size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد أي ديون مسجلة! جميع الحسابات خالصة.</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.id} className="glass-card overflow-hidden">
              <div 
                onClick={() => setExpandedCustomer(expandedCustomer === group.id ? null : group.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <h3 className="font-bold text-white text-lg">{group.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{group.phone || 'بدون هاتف'} • ديون في {group.invoices.length} فواتير</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 mb-1">إجمالي المتبقي عليه</p>
                    <p className="text-xl font-bold text-rose-400">{group.totalDebt.toLocaleString()} ج.م</p>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedCustomer === group.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {expandedCustomer === group.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-black/20"
                  >
                    <div className="p-4 space-y-3">
                      {group.invoices.map(inv => (
                        <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt size={14} className="text-primary-400" />
                              <span className="font-bold text-slate-200">فاتورة #{inv.number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Calendar size={12} />
                              {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString('ar-EG') : new Date(inv.createdAt).toLocaleDateString('ar-EG')}
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-2">
                              قيمة الفاتورة: {inv.total?.toLocaleString()} • المدفوع مسبقاً: <span className="text-emerald-400">{inv.paidAmount?.toLocaleString()}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-rose-500/20">
                            <div>
                              <p className="text-[10px] text-slate-400">الآجل المتبقي</p>
                              <p className="font-bold text-rose-400 text-lg">{inv.dueAmount?.toLocaleString()} ج</p>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <button 
                              onClick={() => { setPaymentModal(inv); setPayAmount(inv.dueAmount); }}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                              <Banknote size={16} /> سداد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setPaymentModal(null)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card relative z-10 w-full max-w-sm p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
            
            <h2 className="text-xl font-bold text-white mb-2">إيصال استلام آجل</h2>
            <p className="text-sm text-slate-400 mb-6">سداد دفعة من فاتورة #{paymentModal.number}</p>
            
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-rose-400 mb-1">المبلغ الإجمالي المتبقي للفاتورة</p>
              <p className="text-2xl font-bold text-rose-500">{paymentModal.dueAmount?.toLocaleString()} ج.م</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">المبلغ المراد سداده حالياً (ج.م)</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)}
                  className="input w-full text-lg font-bold"
                  placeholder="أدخل المبلغ..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handlePay} disabled={!payAmount || isNaN(payAmount) || saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> {saving ? 'جاري الحفظ...' : 'تأكيد السداد'}
                </button>
                <button onClick={() => setPaymentModal(null)} className="btn-ghost px-4">إلغاء</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
