import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Search, Plus, Minus, Trash2, ShoppingCart, Send, MessageCircle } from 'lucide-react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

export default function POS() {
  const { products, categories, cart, cartAdd, cartQty, cartRemove, cartClear, cartTotal, completeSale, invoices } = useStore()

  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' })
  const [paidAmount, setPaid] = useState('')
  const [saving, setSaving]   = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)

  const filtered = products.filter(p =>
    p.quantity > 0 &&
    (!search || p.name?.includes(search) || p.sku?.includes(search)) &&
    (!catFilter || p.category === catFilter)
  )

  const due = Math.max(0, cartTotal - Number(paidAmount || 0))

  const handleSale = async () => {
    if (cart.length === 0 || !customer.name) return
    setSaving(true)
    try {
      const invoiceNumber = `INV-${Date.now()}`
      const id = await completeSale({
        cartItems: cart,
        customerData: { ...customer, paidAmount: Number(paidAmount || cartTotal) },
        total: cartTotal,
        invoiceNumber,
      })
      setDoneInvoice({ id, number: invoiceNumber, total: cartTotal, customer, due })
      setCustomer({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' })
      setPaid('')
    } finally {
      setSaving(false)
    }
  }

  const sendWhatsApp = () => {
    if (!doneInvoice) return
    const msg = `🧾 فاتورة من الفاروق ستور\n` +
      `رقم الفاتورة: ${doneInvoice.number}\n` +
      `العميل: ${doneInvoice.customer.name}\n` +
      `الإجمالي: ${doneInvoice.total.toLocaleString()} ج.م\n` +
      `${doneInvoice.due > 0 ? `المتبقي: ${doneInvoice.due.toLocaleString()} ج.م\n` : ''}` +
      `شكراً لتعاملكم معنا 🙏`
    const phone = doneInvoice.customer.phone
      ? doneInvoice.customer.phone.replace(/^0/, '20')
      : WHATSAPP
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (doneInvoice) return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="card text-center border-green-500/30 bg-green-500/5">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart size={28} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">تم البيع بنجاح! 🎉</h2>
        <p className="text-slate-400 text-sm">فاتورة #{doneInvoice.number}</p>
        <p className="text-2xl font-bold text-primary-400 mt-3">{doneInvoice.total.toLocaleString()} ج.م</p>
        {doneInvoice.due > 0 && (
          <p className="text-red-400 text-sm mt-1">متبقي: {doneInvoice.due.toLocaleString()} ج.م</p>
        )}
      </div>
      <button onClick={sendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
        <MessageCircle size={18} /> إرسال عبر واتساب
      </button>
      <button onClick={() => setDoneInvoice(null)} className="btn-ghost w-full text-sm">
        بيع جديد
      </button>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Products */}
      <div className="flex-1 space-y-3">
        <h1 className="text-xl font-bold text-white">نقطة البيع</h1>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="input pr-9 text-sm" />
          </div>
          <select value={catFilter} onChange={e => setCat(e.target.value)} className="input w-32 text-sm">
            <option value="">الكل</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => cartAdd(p)}
              className="card text-right hover:border-primary-500/50 hover:bg-primary-500/5 transition-all active:scale-95">
              <p className="font-semibold text-white text-sm truncate">{p.name}</p>
              {p.category && <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>}
              <p className="text-primary-400 font-bold mt-2 text-sm">{Number(p.price).toLocaleString()} ج.م</p>
              <span className={`text-xs ${p.quantity <= 5 ? 'text-red-400' : 'text-slate-500'}`}>
                متوفر: {p.quantity}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-8 text-slate-500 text-sm">لا توجد منتجات</div>
          )}
        </div>
      </div>

      {/* Cart + customer */}
      <div className="lg:w-80 space-y-3">
        {/* Cart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary-400" /> السلة
            </h2>
            {cart.length > 0 && (
              <button onClick={cartClear} className="text-xs text-red-400 hover:text-red-300">مسح الكل</button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">السلة فارغة</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-800 rounded-xl px-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-primary-400">{Number(item.price).toLocaleString()} ج.م</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600">
                      <Minus size={11} />
                    </button>
                    <span className="text-white text-xs w-5 text-center">{item.qty}</span>
                    <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600">
                      <Plus size={11} />
                    </button>
                    <button onClick={() => cartRemove(item.id)} className="w-6 h-6 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center mr-1">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">الإجمالي</span>
                <span className="text-primary-400">{cartTotal.toLocaleString()} ج.م</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="card space-y-2">
          <h2 className="font-bold text-white text-sm">بيانات العميل</h2>
          {[
            { key: 'name',         placeholder: 'الاسم *' },
            { key: 'phone',        placeholder: 'رقم الهاتف' },
            { key: 'nationalId',   placeholder: 'الرقم القومي' },
            { key: 'carModel',     placeholder: 'موديل العربية' },
            { key: 'licensePlate', placeholder: 'رقم اللوحة' },
          ].map(f => (
            <input key={f.key} value={customer[f.key]} onChange={e => setCustomer(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} className="input text-sm" />
          ))}
          <div>
            <input type="number" value={paidAmount} onChange={e => setPaid(e.target.value)}
              placeholder={`المبلغ المدفوع (الإجمالي: ${cartTotal.toLocaleString()})`} className="input text-sm" />
            {paidAmount && due > 0 && (
              <p className="text-red-400 text-xs mt-1">متبقي: {due.toLocaleString()} ج.م</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSale}
          disabled={cart.length === 0 || !customer.name || saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {saving ? 'جار الحفظ...' : 'إتمام البيع'}
        </button>
      </div>
    </div>
  )
}
