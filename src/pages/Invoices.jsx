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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">الفواتير والمرتجعات</h1>
        <span className="text-slate-400 text-sm">{invoices.length} فاتورة</span>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو رقم الفاتورة..." className="input text-sm" />

      <div className="space-y-2">
        {filtered.map(inv => {
          const isSelected = selected?.id === inv.id;
          const isReturningMode = returnMode === inv.id;
          const isDeletingMode = deleteConfirm === inv.id;
          
          return (
          <div key={inv.id} className="card cursor-pointer hover:border-slate-700 transition-all overflow-hidden"
            onClick={() => { 
                if (isReturningMode || isDeletingMode) return; // Prevent collapse if in action modes
                setSelected(isSelected ? null : inv); 
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{inv.customerData?.name}</p>
                <p className="text-xs text-slate-400">#{inv.number}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-primary-400 text-sm">{Number(inv.total || 0).toLocaleString('en-US')} ج.م</p>
                <span className={inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus === 'partial' ? 'badge-yellow' : 'badge-red'}>
                  {inv.paymentStatus === 'paid' ? 'مدفوع' : inv.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوع'}
                </span>
              </div>
            </div>

            {isSelected && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                {inv.customerData?.carModel && (
                  <p className="text-xs text-slate-400">العربية: {inv.customerData.carModel} {inv.customerData.licensePlate && `| ${inv.customerData.licensePlate}`}</p>
                )}
                
                {/* Invoice Items List */}
                {inv.items?.map((item, i) => {
                  const maxReturn = item.qty - (item.returnedQty || 0);
                  const remaining = maxReturn;
                  
                  return (
                  <div key={i} className="flex justify-between items-center text-xs p-1.5 hover:bg-white/5 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium">{item.name}</span>
                      <span className="text-slate-500">الكمية: {item.qty} {item.returnedQty > 0 ? <span className="text-red-400 font-bold">(مرتجع: {item.returnedQty})</span> : ''}</span>
                    </div>
                    <span className="text-slate-400 font-bold">{(item.price * item.qty).toLocaleString('en-US')} ج.م</span>
                  </div>
                )})}
                
                {/* Finance Summary */}
                {inv.dueAmount > 0 && (
                  <p className="text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded-lg inline-block my-2">المتبقي على المستلم: {Number(inv.dueAmount).toLocaleString('en-US')} ج.م</p>
                )}
                
                {/* Actions Row */}
                {!isReturningMode && !isDeletingMode && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={e => { e.stopPropagation(); sendWhatsApp(inv) }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
                    >
                      <MessageCircle size={16} /> واتساب
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setReturnMode(inv.id); setReturnQtys({}); }}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
                    >
                      <CornerUpLeft size={16} /> مرتجع
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(inv.id); }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
                    >
                      <Trash2 size={16} /> مسح
                    </button>
                  </div>
                )}

                {/* Partial Return Mode */}
                {isReturningMode && (
                  <div className="mt-4 p-4 glass border-amber-500/20 rounded-xl" onClick={e => e.stopPropagation()}>
                    <p className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2"><CornerUpLeft size={16} /> إضافة مرتجع لبعض القطع</p>
                    
                    <div className="space-y-3 mb-4">
                      {inv.items?.map(item => {
                        const available = item.qty - (item.returnedQty || 0);
                        if (available <= 0) return null;
                        const returnVal = returnQtys[item.id] || 0;
                        
                        return (
                          <div key={item.id} className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                            <span className="text-xs text-white flex-1">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">سعر القطعة: {item.price}</span>
                              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                                <button onClick={() => handleReturnQtyChange(item.id, 1, available)} className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white"><Plus size={14}/></button>
                                <span className="text-sm font-bold w-4 text-center text-amber-400">{returnVal}</span>
                                <button onClick={() => handleReturnQtyChange(item.id, -1, available)} className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white"><Minus size={14}/></button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Return Financial Calculation Preview */}
                    {(() => {
                      const returnSum = Object.entries(returnQtys).reduce((sum, [id, qty]) => {
                        const it = inv.items.find(i => i.id === id);
                        return sum + ((it?.price || 0) * qty);
                      }, 0);
                      
                      let text = '';
                      if (returnSum === 0) text = 'لم يتم تحديد أي قطع لإرجاعها.';
                      else if (inv.dueAmount >= returnSum) text = `سيتم خصم ${returnSum} ج.م بالكامل من المديونية الآجلة للمشتري.`;
                      else if (inv.dueAmount > 0) text = `سقطت مديونية (${inv.dueAmount}) ج.م | وسيتم رد مبلغ نقدي كاش للعميل: ${returnSum - inv.dueAmount} ج.م`;
                      else text = `يجب رد هذا المبلغ نقداً كاش للعميل: ${returnSum} ج.م`;

                      return (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-amber-300">إجمالي قيمة المرتجع المحددة: {returnSum.toLocaleString('en-US')} ج.م</p>
                          <p className="text-[10px] text-slate-400 mt-1">{text}</p>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                       <button 
                        onClick={() => submitPartialReturn(inv)}
                        disabled={isReturning || Object.values(returnQtys).every(q => q === 0)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        {isReturning ? 'جاري التنفيذ...' : 'تأكيد المرتجع'}
                      </button>
                      <button 
                        onClick={() => setReturnMode(null)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-lg font-bold transition-all"
                      >
                        إلغاء التراجع
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Mode */}
                {isDeletingMode && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" onClick={e => e.stopPropagation()}>
                    <p className="text-xs font-bold text-red-400 flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} /> مسح الفاتورة بالكامل، وتصفير المديونيات واسترداد أي بضاعة متبقية؟
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
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 font-bold transition-all"
                      >
                        {isDeleting ? 'جاري الحذف...' : 'نعم، مسح الفاتورة'}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-lg font-bold transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )})}
        
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا توجد فواتير بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
