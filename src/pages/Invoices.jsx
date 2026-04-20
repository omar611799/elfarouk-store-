import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { FileText, MessageCircle, Search, Trash2, AlertTriangle, CornerUpLeft, Plus, Minus } from 'lucide-react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

export default function Invoices() {
  const { invoices, deleteInvoice, returnInvoiceItems } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  
  // States for actions
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [returnMode, setReturnMode] = useState(null)
  const [isReturning, setIsReturning] = useState(false)
  // { 'item_id': quantity_to_return }
  const [returnQtys, setReturnQtys] = useState({})

  const filtered = useMemo(() => {
    return invoices.filter(i =>
      !search || i.customerData?.name?.includes(search) || String(i.number)?.includes(search)
    )
  }, [invoices, search])

  const sendWhatsApp = (inv) => {
    const items = inv.items?.map(i => {
      let line = `- ${i.name} × ${i.qty}`;
      if (i.returnedQty > 0) line += ` (مرتجع ${i.returnedQty})`;
      return line + ` = ${(i.price * i.qty).toLocaleString('en-US')} ج.م`;
    }).join('\n') || ''
    
    const msg = `🧾 فاتورة من الفاروق ستور\n` +
      `رقم: ${inv.number}\n` +
      `العميل: ${inv.customerData?.name}\n` +
      `${inv.customerData?.carModel ? `العربية: ${inv.customerData.carModel}\n` : ''}` +
      `\nالمنتجات:\n${items}\n\n` +
      `الإجمالي: ${inv.total?.toLocaleString('en-US')} ج.م\n` +
      `${inv.dueAmount > 0 ? `المتبقي: ${inv.dueAmount?.toLocaleString('en-US')} ج.م\n` : '✅ مدفوع بالكامل\n'}` +
      `شكراً لتعاملكم معنا 🙏`
    const phone = inv.customerData?.phone?.replace(/^0/, '20') || WHATSAPP
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleReturnQtyChange = (itemId, delta, maxAvailable) => {
    setReturnQtys(prev => {
      const current = prev[itemId] || 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > maxAvailable) next = maxAvailable;
      return { ...prev, [itemId]: next };
    })
  }

  const submitPartialReturn = async (inv) => {
    const itemsToReturn = Object.entries(returnQtys)
      .filter(([id, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, qty }));
      
    if (itemsToReturn.length === 0) return;

    setIsReturning(true);
    try {
      await returnInvoiceItems({ invoiceId: inv.id, itemsToReturn });
      setReturnMode(null);
      setReturnQtys({});
    } finally {
      setIsReturning(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32">
      <div className="flex items-center justify-between px-1">
        <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                    <FileText size={20} className="text-electric-400" />
                </div>
                الفواتير والمرتجعات
            </h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">إجمالي الفواتير: {invoices.length}</p>
        </div>
      </div>

      <div className="relative group px-1">
        <Search size={16} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الفاتورة..." className="input pr-10 sm:pr-12 text-sm" />
      </div>

      <div className="space-y-3 sm:space-y-4 px-1">
        {filtered.map(inv => {
          const isSelected = selected?.id === inv.id;
          const isReturningMode = returnMode === inv.id;
          const isDeletingMode = deleteConfirm === inv.id;
          
          return (
          <div key={inv.id} className={`card !py-4 !px-4 sm:!py-5 sm:!px-8 cursor-pointer transition-all overflow-hidden ${isSelected ? 'border-electric-500/30' : 'hover:border-white/10'}`}
            onClick={() => { 
                if (isReturningMode || isDeletingMode) return; 
                setSelected(isSelected ? null : inv); 
            }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-obsidian-950 border border-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-electric-400 opacity-50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base sm:text-lg tracking-tight font-display truncate leading-tight mb-1">{inv.customerData?.name || 'عميل نقدي'}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">فــاتورة #{inv.number}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-black text-white text-base sm:text-lg font-display tracking-tight leading-none mb-1">{Number(inv.total || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-500 font-normal">ج.م</span></p>
                <div className="flex justify-end">
                    <span className={inv.paymentStatus === 'paid' ? 'badge-green !text-[8px] !px-2' : inv.paymentStatus === 'partial' ? 'badge-yellow !text-[8px] !px-2' : 'badge-red !text-[8px] !px-2'}>
                    {inv.paymentStatus === 'paid' ? 'مدفوعة' : inv.paymentStatus === 'partial' ? 'جزئية' : 'غير مدفوعة'}
                    </span>
                </div>
              </div>
            </div>

            {isSelected && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {inv.customerData?.carModel && (
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md w-fit">المعدات: {inv.customerData.carModel} {inv.customerData.licensePlate && `• ${inv.customerData.licensePlate}`}</p>
                )}
                
                <div className="space-y-1.5 px-1 py-1 bg-black/20 rounded-2xl border border-white/[0.02]">
                    {inv.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] p-2 hover:bg-white/5 rounded-xl">
                            <div className="flex flex-col">
                            <span className="text-slate-300 font-black font-display">{item.name}</span>
                            <span className="text-slate-600 font-black uppercase text-[8px] mt-0.5">الكمية: {item.qty} {item.returnedQty > 0 ? <span className="text-rose-500">(مرتجع: {item.returnedQty})</span> : ''}</span>
                            </div>
                            <span className="text-white font-black font-display">{(item.price * item.qty).toLocaleString('en-US')} ج.م</span>
                        </div>
                    ))}
                </div>
                
                {inv.dueAmount > 0 && (
                  <div className="flex items-center gap-2 bg-rose-500/5 text-rose-500 p-2.5 rounded-xl border border-rose-500/10">
                    <AlertTriangle size={14} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest">المتبقي على المستلم: {Number(inv.dueAmount).toLocaleString('en-US')} ج.م</p>
                  </div>
                )}
                
                {!isReturningMode && !isDeletingMode && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={e => { e.stopPropagation(); sendWhatsApp(inv) }}
                      className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                    >
                      <MessageCircle size={14} /> واتساب
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setReturnMode(inv.id); setReturnQtys({}); }}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest border border-amber-500/10"
                    >
                      <CornerUpLeft size={14} /> مرتجع
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(inv.id); }}
                      className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest border border-amber-500/10"
                    >
                      <Trash2 size={14} /> مسح
                    </button>
                  </div>
                )}

                {isReturningMode && (
                  <div className="mt-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><CornerUpLeft size={14} /> مرتجع جزئي للفاتورة</p>
                    
                    <div className="space-y-2 mb-4">
                      {inv.items?.map(item => {
                        const available = item.qty - (item.returnedQty || 0);
                        if (available <= 0) return null;
                        const returnVal = returnQtys[item.id] || 0;
                        
                        return (
                          <div key={item.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/[0.02]">
                            <span className="text-[10px] text-white font-display font-black flex-1 pr-2">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-obsidian-950/50 rounded-lg p-1 border border-white/5">
                                <button onClick={() => handleReturnQtyChange(item.id, 1, available)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white"><Plus size={14}/></button>
                                <span className="text-sm font-black w-4 text-center text-amber-500 font-display">{returnVal}</span>
                                <button onClick={() => handleReturnQtyChange(item.id, -1, available)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white"><Minus size={14}/></button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {(() => {
                      const returnSum = Object.entries(returnQtys).reduce((sum, [id, qty]) => {
                        const it = inv.items.find(i => i.id === id);
                        return sum + ((it?.price || 0) * qty);
                      }, 0);
                      
                      let text = '';
                      if (returnSum === 0) text = 'حدد القطع لإتمام المرتجع.';
                      else if (inv.dueAmount >= returnSum) text = `سيخصم (${returnSum}) من مديونية العميل.`;
                      else if (inv.dueAmount > 0) text = `تصفير المديونية ورد (${returnSum - inv.dueAmount}) نقداً.`;
                      else text = `يجب رد (${returnSum}) ج.م نقداً للعميل.`;

                      return (
                        <div className="mb-4 px-1">
                          <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">إجمالي المرتجع: {returnSum.toLocaleString('en-US')} ج.م</p>
                          <p className="text-[9px] text-slate-500 font-black mt-1 uppercase tracking-tight">{text}</p>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                       <button 
                        onClick={() => submitPartialReturn(inv)}
                        disabled={isReturning || Object.values(returnQtys).every(q => q === 0)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] py-3 rounded-xl flex items-center justify-center gap-1 font-black uppercase tracking-widest transition-all"
                      >
                        {isReturning ? 'جاري التنفيذ...' : 'تأكيد المرتجع'}
                      </button>
                      <button 
                        onClick={() => setReturnMode(null)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-white/5"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {isDeletingMode && (
                  <div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-black text-rose-500 flex items-center gap-2 mb-4 uppercase tracking-tighter leading-snug">
                      <AlertTriangle size={16} className="shrink-0" /> تصفير المديونية واسترداد البضاعة للفاتورة بالكامل؟
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          setIsDeleting(true)
                          try {
                            await deleteInvoice(inv.id)
                          } finally {
                            setIsDeleting(false)
                            setDeleteConfirm(null)
                            setSelected(null)
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] py-3 rounded-xl flex items-center justify-center gap-1 font-black uppercase tracking-widest transition-all"
                      >
                        {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-white/5"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="card text-center py-20 border-dashed border-white/5 opacity-30">
            <FileText size={50} className="text-slate-500 mx-auto mb-6" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">المخدم لا يحتوي على فواتير حالياً</p>
          </div>
        )}
      </div>
    </div>
  )
}
