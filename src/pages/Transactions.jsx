import { useStore } from '../context/StoreContext'
import { ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react'

export default function Transactions() {
  const { transactions } = useStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">المعاملات</h1>
        <span className="text-slate-400 text-sm">{transactions.length} معاملة</span>
      </div>

      <div className="space-y-2">
        {transactions.map(tx => (
          <div key={tx.id} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tx.type === 'sale' ? 'bg-green-500/10' : tx.type === 'stockIn' ? 'bg-blue-500/10' : 'bg-orange-500/10'
            }`}>
              {tx.type === 'sale'
                ? <TrendingUp size={18} className="text-green-400" />
                : tx.type === 'stockIn'
                ? <ArrowLeftRight size={18} className="text-blue-400" />
                : <TrendingDown size={18} className="text-orange-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{tx.details}</p>
              <p className="text-xs text-slate-400">
                {tx.type === 'sale' ? 'بيع' : tx.type === 'stockIn' ? 'إضافة مخزون' : 'صرف مخزون'}
              </p>
            </div>
            <p className={`font-bold text-sm ${tx.type === 'sale' ? 'text-green-400' : 'text-slate-400'}`}>
              {tx.type === 'sale' ? `+${Number(tx.amount || 0).toLocaleString()} ج.م` : `${tx.amount} قطعة`}
            </p>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا توجد معاملات بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
