import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { FileText, Trash2, Printer, ArrowRight, Search, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Quotes() {
  const { quotes, deleteQuote, cartClear, cartAdd } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return quotes.filter(q =>
      !search || q.customerData?.name?.includes(search) || String(q.number)?.includes(search)
    )
  }, [quotes, search])

  const convertToInvoice = (quote) => {
    cartClear()
    quote.items.forEach(item => cartAdd({ ...item, qty: item.qty }))
    localStorage.setItem('pendingQuoteCustomer', JSON.stringify({ ...quote.customerData }))
    toast.success('تم نقل العرض لنقطة البيع. راجع التفاصيل وأتمم البيع.', { icon: '🛒' })
    navigate('/pos')
  }

  const printQuote = (quote) => {
    navigate(`/print-quote/${quote.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <Tag size={20} className="text-primary-600" />
            </div>
            عروض الأسعار التسعيرية
          </h1>
          <p className="text-slate-500 text-xs mt-1">إدارة وطباعة عروض الأسعار للعملاء</p>
        </div>
        <span className="bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1.5 rounded-full text-sm font-bold">
          {quotes.length} عرض
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-4 top-3 text-slate-400" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث باسم العميل أو رقم العرض..." 
          className="w-full bg-white border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all"
        />
      </div>

      {/* Quotes List */}
      <div className="space-y-3">
        {filtered.map(quote => {
          const isSelected = selected?.id === quote.id
          const quoteDate = quote.createdAt?.toDate?.() || new Date(0)
          return (
            <div 
              key={quote.id} 
              className={`bg-white border rounded-2xl cursor-pointer transition-all overflow-hidden shadow-sm ${
                isSelected ? 'border-primary-300 shadow-primary-100' : 'border-slate-200 hover:border-primary-200 hover:shadow-md'
              }`}
              onClick={() => setSelected(isSelected ? null : quote)}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{quote.customerData?.name || 'عميل مجهول'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">#{quote.number}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-black text-primary-600 text-sm">{Number(quote.total || 0).toLocaleString('en-US')} <span className="text-[10px] font-normal text-slate-400">ج.م</span></p>
                  <span className="text-[10px] text-slate-400">{quoteDate.toLocaleDateString()}</span>
                </div>
              </div>

              {isSelected && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100 mt-0 space-y-3">
                  {quote.customerData?.carModel && (
                    <p className="text-xs text-slate-500 pt-3">السيارة: <span className="font-semibold text-slate-700">{quote.customerData.carModel}</span></p>
                  )}
                  
                  <div className="space-y-1">
                    {quote.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-700 font-medium">{item.name} × {item.qty}</span>
                        <span className="text-slate-600 font-bold">{(item.price * item.qty).toLocaleString('en-US')} ج.م</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); printQuote(quote) }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold border border-slate-200"
                    >
                      <Printer size={15} /> طباعة PDF
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); convertToInvoice(quote) }}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
                    >
                      <ArrowRight size={15} /> نقل لنقطة البيع
                    </button>
                    <button
                      onClick={async e => { 
                        e.stopPropagation(); 
                        if(window.confirm('هل أنت متأكد من حذف العرض؟')) {
                            await deleteQuote(quote.id)
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 px-4 py-2.5 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-16">
            <FileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">لا توجد عروض أسعار 📋</p>
          </div>
        )}
      </div>
    </div>
  )
}
