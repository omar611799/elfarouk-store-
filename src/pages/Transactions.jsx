import { useStore } from '../context/StoreContext'
import { ArrowLeftRight, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'

export default function Transactions() {
  const { transactions } = useStore()

  const getTypeConfig = (type) => {
    if (type === 'sale') return { bg: 'bg-emerald-50 border-emerald-200', icon: TrendingUp, iconColor: 'text-emerald-600', label: 'بيع', amountColor: 'text-emerald-600' }
    if (type === 'stockIn') return { bg: 'bg-primary-50 border-primary-200', icon: ArrowLeftRight, iconColor: 'text-primary-600', label: 'إضافة مخزون', amountColor: 'text-slate-600' }
    return { bg: 'bg-slate-100 border-slate-200', icon: TrendingDown, iconColor: 'text-slate-500', label: 'صرف مخزون', amountColor: 'text-slate-500' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center">
              <ArrowRightLeft size={20} className="text-primary-600" />
            </div>
            المعاملات
          </h1>
          <p className="text-slate-500 text-xs mt-1">سجل جميع عمليات البيع وحركات المخزون</p>
        </div>
        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-sm font-bold">
          {transactions.length} معاملة
        </span>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map(tx => {
          const config = getTypeConfig(tx.type)
          const Icon = config.icon
          return (
            <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all shadow-sm">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.bg}`}>
                <Icon size={18} className={config.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-semibold truncate">{tx.details}</p>
                <p className="text-xs text-slate-400 mt-0.5">{config.label}</p>
              </div>
              <p className={`font-bold text-sm shrink-0 ${config.amountColor}`}>
                {tx.type === 'sale' 
                  ? `+${Number(tx.amount || 0).toLocaleString('en-US')} ج.م` 
                  : `${tx.amount} قطعة`
                }
              </p>
            </div>
          )
        })}
        {transactions.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-16">
            <ArrowRightLeft size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">لا توجد معاملات بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
