import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { FileText, Search, Trash2, Printer, ArrowRight } from 'lucide-react'
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
    cartClear();
    // Re-add items to cart
    quote.items.forEach(item => cartAdd({ ...item, qty: item.qty }));
    // Pass customer to localStorage to pick up in POS
    localStorage.setItem('pendingQuoteCustomer', JSON.stringify({ ...quote.customerData }));
    toast.success('تم نقل العرض لنقطة البيع. راجع التفاصيل وأتمم البيع.', { icon: '🛒' });
    navigate('/');
  }

  const printQuote = (quote) => {
    // We will navigate to a print-only layout route
    navigate(`/print-quote/${quote.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">عروض الأسعار التسعيرية</h1>
        <span className="text-slate-400 text-sm">{quotes.length} عرض</span>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="بحث باسم العميل أو رقم العرض..." className="input text-sm" />

      <div className="space-y-2">
        {filtered.map(quote => {
          const isSelected = selected?.id === quote.id;
          return (
          <div key={quote.id} className="card cursor-pointer hover:border-amber-700/50 transition-all overflow-hidden"
            onClick={() => setSelected(isSelected ? null : quote)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{quote.customerData?.name || 'عميل مجهول'}</p>
                <p className="text-xs text-slate-400">{quote.number}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-amber-400 text-sm">{Number(quote.total || 0).toLocaleString('en-US')} ج.م</p>
                <span className="text-[10px] text-slate-400">{new Date(quote.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            {isSelected && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                {quote.customerData?.carModel && (
                  <p className="text-xs text-slate-400">السيارة: {quote.customerData.carModel}</p>
                )}
                
                {quote.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-black/20 rounded-lg">
                    <span className="text-slate-300 font-medium">{item.name} × {item.qty}</span>
                    <span className="text-slate-400 font-bold">{(item.price * item.qty).toLocaleString('en-US')} ج.م</span>
                  </div>
                ))}
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={e => { e.stopPropagation(); printQuote(quote) }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
                  >
                    <Printer size={16} /> طباعة عرض السعر (PDF)
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); convertToInvoice(quote) }}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
                  >
                    <ArrowRight size={16} /> استرجاع لنقطة البيع (شراء)
                  </button>
                  <button
                    onClick={async e => { 
                      e.stopPropagation(); 
                      if(window.confirm('هل أنت متأكد من حذف العرض؟')) {
                          await deleteQuote(quote.id)
                      }
                    }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )})}
        
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا توجد عروض أسعار 📋</p>
          </div>
        )}
      </div>
    </div>
  )
}
