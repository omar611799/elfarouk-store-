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

  const unpaidInvoices = useMemo(() => {
    return invoices.filter(inv => inv.dueAmount > 0)
  }, [invoices])

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
    
    return Object.values(groups).filter(g => 
      !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
    ).sort((a, b) => b.totalDebt - a.totalDebt)
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">دفتر المديونيات وكشف الحساب</h1>
          <p className="text-slate-500 text-xs mt-1">تتبع الديون الآجلة للعملاء وقم بتحصيلها بسهولة</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-6 py-3 text-left">
          <p className="text-rose-500 text-xs font-bold mb-0.5">إجمالي ديون السوق الآجلة</p>
          <p className="text-2xl font-black text-rose-600">{totalMarketDebt.toLocaleString('en-US')} <span className="text-sm font-normal">ج.م</span></p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم العميل أو رقم الهاتف..." 
          className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all"
        />
      </div>

      {/* Customer Debt Cards */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
            <UserMinus size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لا توجد أي ديون مسجلة! جميع الحسابات خالصة.</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div 
                onClick={() => setExpandedCustomer(expandedCustomer === group.id ? null : group.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="font-black text-slate-800 text-base">{group.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{group.phone || 'بدون هاتف'} • ديون في {group.invoices.length} فواتير</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 mb-1">إجمالي المتبقي</p>
                    <p className="text-xl font-black text-rose-600">{group.totalDebt.toLocaleString('en-US')} <span className="text-xs font-normal">ج.م</span></p>
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
                    className="border-t border-slate-100 bg-slate-50"
                  >
                    <div className="p-4 space-y-3">
                      {group.invoices.map(inv => (
                        <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 gap-4 shadow-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt size={14} className="text-primary-500" />
                              <span className="font-bold text-slate-700 text-sm">فاتورة #{inv.number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Calendar size={12} />
                              {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString('en-GB') : new Date(inv.createdAt).toLocaleDateString('en-GB')}
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                              قيمة الفاتورة: {inv.total?.toLocaleString('en-US')} • المدفوع: <span className="text-emerald-600 font-bold">{inv.paidAmount?.toLocaleString('en-US')}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold">الآجل المتبقي</p>
                              <p className="font-black text-rose-600 text-lg">{inv.dueAmount?.toLocaleString('en-US')} <span className="text-xs font-normal">ج</span></p>
                            </div>
                            <div className="w-px h-8 bg-rose-100 mx-2" />
                            <button 
                              onClick={() => { setPaymentModal(inv); setPayAmount(inv.dueAmount); }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
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
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPaymentModal(null)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-sm p-6 border border-slate-200"
          >
            <h2 className="text-xl font-black text-slate-800 mb-1">إيصال استلام آجل</h2>
            <p className="text-sm text-slate-500 mb-5">سداد دفعة من فاتورة #{paymentModal.number}</p>
            
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 text-center">
              <p className="text-xs text-rose-500 font-bold mb-1">المبلغ الإجمالي المتبقي</p>
              <p className="text-2xl font-black text-rose-600">{paymentModal.dueAmount?.toLocaleString('en-US')} ج.م</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">المبلغ المراد سداده (ج.م)</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  placeholder="أدخل المبلغ..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handlePay} 
                  disabled={!payAmount || isNaN(payAmount) || saving} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <CheckCircle2 size={17} /> {saving ? 'جاري الحفظ...' : 'تأكيد السداد'}
                </button>
                <button 
                  onClick={() => setPaymentModal(null)} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
