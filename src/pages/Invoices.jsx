import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { FileText, MessageCircle, Search, Trash2, AlertTriangle } from 'lucide-react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

export default function Invoices() {
  const { invoices, deleteInvoice } = useStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = invoices.filter(i =>
    !search || i.customerData?.name?.includes(search) || String(i.number)?.includes(search)
  )

  const sendWhatsApp = (inv) => {
    const items = inv.items?.map(i => `- ${i.name} × ${i.qty} = ${(i.price * i.qty).toLocaleString()} ج.م`).join('\n') || ''
    const msg = `🧾 فاتورة من الفاروق ستور\n` +
      `رقم: ${inv.number}\n` +
      `العميل: ${inv.customerData?.name}\n` +
      `${inv.customerData?.carModel ? `العربية: ${inv.customerData.carModel}\n` : ''}` +
      `\nالمنتجات:\n${items}\n\n` +
      `الإجمالي: ${inv.total?.toLocaleString()} ج.م\n` +
      `${inv.dueAmount > 0 ? `المتبقي: ${inv.dueAmount?.toLocaleString()} ج.م\n` : '✅ مدفوع بالكامل\n'}` +
      `شكراً لتعاملكم معنا 🙏`
    const phone = inv.customerData?.phone?.replace(/^0/, '20') || WHATSAPP
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">الفواتير</h1>
        <span className="text-slate-400 text-sm">{invoices.length} فاتورة</span>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو رقم الفاتورة..." className="input text-sm" />

      <div className="space-y-2">
        {filtered.map(inv => (
          <div key={inv.id} className="card cursor-pointer hover:border-slate-700 transition-all"
            onClick={() => { setSelected(selected?.id === inv.id ? null : inv); setDeleteConfirm(null); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{inv.customerData?.name}</p>
                <p className="text-xs text-slate-400">#{inv.number}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-bold text-primary-400 text-sm">{Number(inv.total || 0).toLocaleString()} ج.م</p>
                <span className={inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus === 'partial' ? 'badge-yellow' : 'badge-red'}>
                  {inv.paymentStatus === 'paid' ? 'مدفوع' : inv.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوع'}
                </span>
              </div>
            </div>

            {selected?.id === inv.id && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                {inv.customerData?.carModel && (
                  <p className="text-xs text-slate-400">العربية: {inv.customerData.carModel} {inv.customerData.licensePlate && `| ${inv.customerData.licensePlate}`}</p>
                )}
                {inv.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-300">{item.name} × {item.qty}</span>
                    <span className="text-slate-400">{(item.price * item.qty).toLocaleString()} ج.م</span>
                  </div>
                ))}
                {inv.dueAmount > 0 && (
                  <p className="text-red-400 text-xs">متبقي: {Number(inv.dueAmount).toLocaleString()} ج.م</p>
                )}
                {inv.payments && (
                  <div className="flex flex-wrap gap-2 text-[10px] bg-slate-800/50 p-2 rounded-lg mt-1 border border-white/5">
                    {Number(inv.payments.cash || 0) > 0 && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">كاش: {Number(inv.payments.cash).toLocaleString()}</span>}
                    {Number(inv.payments.visa || 0) > 0 && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">فيزا: {Number(inv.payments.visa).toLocaleString()}</span>}
                    {Number(inv.payments.instapay || 0) > 0 && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">إنستا باي: {Number(inv.payments.instapay).toLocaleString()}</span>}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={e => { e.stopPropagation(); sendWhatsApp(inv) }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle size={14} /> واتساب
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(inv.id) }}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {deleteConfirm === inv.id && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl" onClick={e => e.stopPropagation()}>
                    <p className="text-xs font-bold text-red-400 flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} /> هل أنت متأكد من مسح الفاتورة واسترداد المخزون وخصم المديونية من العميل؟
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
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold"
                      >
                        {isDeleting ? 'جاري الحذف...' : 'نعم، مسح واسترداد'}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-400 text-sm">لا توجد فواتير بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
