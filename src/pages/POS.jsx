import { useState, useMemo, memo, useCallback } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, Users, 
  ChevronLeft, Send, MessageCircle, Camera, Mic, Sparkles,
  Wallet, CreditCard, Landmark
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// ✅ IMPORTANT: CartContent MUST be wrapped in memo and defined OUTSIDE of POS component.
// This prevents focus loss after every character typed.
const CartContent = memo(({
  cart, cartTotal, cartClear, cartQty, cartRemove,
  customer, setCustomer, suggestedCustomers,
  payments, setPayments,
  saving, handleSale, setIsCartOpen
}) => {
  return (
    <div className="flex flex-col h-full bg-obsidian-950/20">
      <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-obsidian-900/80 backdrop-blur-xl z-20">
        <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-3">
          <ShoppingCart size={20} className="text-primary-400" />
          سلة البيع
        </h2>
        <div className="flex gap-4 items-center">
          {cart.length > 0 && (
            <button onClick={cartClear} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors">
              مسح الكل
            </button>
          )}
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-white bg-white/5 rounded-full">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide space-y-3 sm:space-y-4">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                <ShoppingCart size={32} className="text-slate-500" />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">السلة فارغة حالياً</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -80) {
                    cartRemove(item.id)
                    if (window.navigator?.vibrate) window.navigator.vibrate(10)
                  }
                }}
                key={item.id}
                className="bg-obsidian-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 hover:border-white/10 transition-all group touch-pan-y"
              >
                <div className="flex items-center gap-3 sm:gap-4 pointer-events-none">
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-white font-black truncate font-display leading-tight">{item.name}</p>
                    <p className="text-xs text-emerald-400 font-black mt-1.5 sm:mt-2 tracking-wide font-display drop-shadow-sm">
                      {Number(item.price).toLocaleString('en-US')} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-obsidian-950 border border-white/5 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shrink-0 pointer-events-auto">
                    <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors bg-white/5">
                      <Minus size={16} className="text-slate-400" />
                    </button>
                    <span className="text-white text-base sm:text-sm font-black w-6 text-center">{item.qty}</span>
                    <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors bg-white/5">
                      <Plus size={16} className="text-slate-400" />
                    </button>
                  </div>
                  <button onClick={() => cartRemove(item.id)} className="w-9 h-9 sm:w-10 sm:h-10 text-rose-500 hover:bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all px-2 pointer-events-auto hidden sm:flex">
                    <Trash2 size={16} />
                  </button>
                  <div className="sm:hidden text-rose-500/30 text-[8px] font-black uppercase tracking-widest pl-2">اسحب للحذف</div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 border-t border-white/5 bg-obsidian-950/40 backdrop-blur-3xl pb-safe">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex justify-between items-center px-1">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">إجمالي السلة</span>
            <span className="text-2xl sm:text-4xl font-black text-white font-display tracking-tighter">
              {cartTotal.toLocaleString('en-US')} <span className="text-xs sm:text-sm font-normal text-slate-500">ج.م</span>
            </span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="relative group">
            <input
              id="customer-name-input"
              value={customer.name}
              onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
              placeholder="اسم العميل..."
              className="input !py-4 pr-12 text-sm"
              autoComplete="off"
            />
            <Users size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" />

            {suggestedCustomers.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-3 bg-obsidian-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-premium z-50 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                {suggestedCustomers.map(sc => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })}
                    className="w-full text-right px-4 sm:px-6 py-3.5 hover:bg-electric-500/10 transition-all flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronLeft size={14} className="text-slate-700 group-hover:text-primary-400 group-hover:-translate-x-1 transition-all" />
                      <span className="text-primary-400 font-black text-[9px] uppercase tracking-widest">{sc.phone}</span>
                    </div>
                    <span className="text-white text-xs sm:text-sm font-black font-display">{sc.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <input
              id="customer-car-input"
              value={customer.carModel}
              onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))}
              placeholder="نوع العربية"
              className="input !py-4 text-sm font-bold"
            />
            <input
              id="customer-phone-input"
              value={customer.phone}
              onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
              placeholder="رقم الموبايل"
              className="input !py-4 text-sm font-bold"
            />
          </div>

          {/* Payment Section */}
          <div className="pt-2 border-t border-white/5 mt-4">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3 px-1 text-center">طريقة الدفع (اختياري)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="relative">
                <input
                  id="pay-cash"
                  type="number"
                  value={payments.cash}
                  onChange={e => setPayments(p => ({ ...p, cash: e.target.value }))}
                  placeholder="كاش"
                  className="input !py-4 sm:!py-3 !pr-10 sm:!pr-8 text-sm sm:text-xs font-bold bg-emerald-500/5 focus:border-emerald-500/50"
                />
                <Wallet size={16} className="absolute right-3.5 sm:right-2.5 top-1/2 -translate-y-1/2 text-emerald-500/50" />
              </div>
              <div className="relative">
                <input
                  id="pay-visa"
                  type="number"
                  value={payments.visa}
                  onChange={e => setPayments(p => ({ ...p, visa: e.target.value }))}
                  placeholder="فيزا"
                  className="input !py-4 sm:!py-3 !pr-10 sm:!pr-8 text-sm sm:text-xs font-bold bg-blue-500/5 focus:border-blue-500/50"
                />
                <CreditCard size={16} className="absolute right-3.5 sm:right-2.5 top-1/2 -translate-y-1/2 text-blue-500/50" />
              </div>
              <div className="relative">
                <input
                  id="pay-instapay"
                  type="number"
                  value={payments.instapay}
                  onChange={e => setPayments(p => ({ ...p, instapay: e.target.value }))}
                  placeholder="إنستاباي"
                  className="input !py-4 sm:!py-3 !pr-10 sm:!pr-8 text-sm sm:text-xs font-bold bg-purple-500/5 focus:border-purple-500/50"
                />
                <Landmark size={16} className="absolute right-3.5 sm:right-2.5 top-1/2 -translate-y-1/2 text-purple-500/50" />
              </div>
            </div>
            
            {/* Payment Summary */}
            {(Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)) > 0 && (
              <div className="mt-3 flex justify-between items-center px-2 py-2 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 font-bold uppercase">إجمالي المدفوع:</span>
                <span className="text-xs font-black text-emerald-400">
                  {(Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)).toLocaleString('en-US')} ج.م
                </span>
              </div>
            )}
            
            {cartTotal > (Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)) && (
               <div className="mt-1 flex justify-between items-center px-2 py-1">
                <span className="text-[9px] text-rose-500/70 font-bold uppercase">متبقي (مديونية):</span>
                <span className="text-[10px] font-black text-rose-400">
                  {(cartTotal - (Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0))).toLocaleString('en-US')} ج.م
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSale}
              disabled={cart.length === 0 || !customer.name || saving}
              className="btn-primary !py-4 flex-1 text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-neon disabled:opacity-20 active:scale-95"
            >
              <Send size={18} /> {saving ? 'جار الحفظ...' : 'إتمام البيع'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
})
CartContent.displayName = 'CartContent'

export default function POS() {
  const {
    products, cart, cartAdd, cartRemove, cartQty, cartClear, cartTotal,
    completeSale, customers
  } = useStore()

  const [search, setSearch] = useState('')
  const [catFilter, setCat] = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '' })
  const [saving, setSaving] = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [reminders, setReminders] = useState({})

  const categoriesList = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))]
  }, [products])

  const filtered = useMemo(() => {
    const terms = search.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
    return products.filter(p => {
      if (p.quantity <= 0) return false
      const matchCat = !catFilter || p.category === catFilter
      if (!matchCat) return false
      if (terms.length === 0) return true
      return terms.every(t =>
        p.name?.toLowerCase().includes(t) ||
        p.sku?.toLowerCase().includes(t) ||
        p.category?.toLowerCase().includes(t)
      )
    })
  }, [products, search, catFilter])

  const suggestedCustomers = useMemo(() => {
    if (!customer.name || customer.name.length < 2) return []
    return customers.filter(c =>
      c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
      c.phone?.includes(customer.name)
    ).slice(0, 5)
  }, [customers, customer.name])

  const handleSale = async () => {
    if (cart.length === 0 || !customer.name) return
    setSaving(true)
    try {
      const totalPaid = Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)
      const dueAmount = cartTotal - totalPaid

      const { id: invId, number: invNum } = await completeSale({
        customerData: customer,
        items: cart.map(i => ({ ...i, reminderMonths: reminders[i.id] || 0 })),
        total: cartTotal,
        paidAmount: totalPaid,
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        payments: {
          cash: Number(payments.cash || 0),
          visa: Number(payments.visa || 0),
          instapay: Number(payments.instapay || 0)
        }
      })

      setDoneInvoice({ id: invId, number: invNum, total: cartTotal, due: dueAmount > 0 ? dueAmount : 0 })
      setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
      setPayments({ cash: '', visa: '', instapay: '' })
      setReminders({})
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const sendWhatsApp = () => {
    if (!doneInvoice) return
    const msg = `🧾 فاتورة من الفاروق ستور\nالإجمالي: ${doneInvoice.total} ج.م\nرقم: ${doneInvoice.id}\nشكراً لتعاملكم معنا 🙏`
    const phone = customer.phone?.replace(/^0/, '20') || '201115329887'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const html5QrCode = new Html5Qrcode('reader')
    html5QrCode.scanFile(file, true)
      .then(decodedText => { setSearch(decodedText); setShowScanner(false) })
      .catch(() => setScannerError('فشل قراءة الملف. تأكد من وضوح الباركود.'))
  }

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e) => { setSearch(e.results[0][0].transcript); setIsListening(false) }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleCartAdd = (p) => {
    cartAdd(p)
    if (window.navigator?.vibrate) window.navigator.vibrate(15)
  }

  const cartProps = useMemo(() => ({
    cart, cartTotal, cartClear, cartQty, cartRemove,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments,
    saving, handleSale, setIsCartOpen
  }), [
    cart, cartTotal, cartClear, cartQty, cartRemove,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments,
    saving, handleSale, setIsCartOpen
  ])

  if (doneInvoice) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-10 px-4">
      <div className="card text-center relative overflow-hidden flex flex-col items-center py-10 sm:py-16">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Send size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3 font-display tracking-tight">تم البيع بنجاح!</h2>
        <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest mb-8 sm:mb-10">إيصال رقم: {doneInvoice.number}</p>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] mx-auto mb-8 sm:mb-10 shadow-premium group transition-transform hover:scale-105 border-4 sm:border-8 border-white/5">
          <QRCodeSVG value={`${window.location.origin}/receipt/${doneInvoice.id}`} size={180} />
        </div>
        <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-4 font-display">
          {doneInvoice.total.toLocaleString('en-US')} <span className="text-sm sm:text-2xl text-slate-500 font-normal">ج.م</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mt-4 sm:mt-6 px-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendWhatsApp} className="btn-primary !bg-emerald-600 hover:!bg-emerald-500 !shadow-[0_10px_20px_rgba(16,185,129,0.2)]">
            <MessageCircle size={18} /> واتساب العميل
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDoneInvoice(null)} className="btn-ghost">
            عملية بيع جديدة
          </motion.button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 pb-40 pt-0 sm:pt-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 space-y-4 sm:space-y-8">

        {/* Search Header */}
        <div className="sticky top-0 z-[40] bg-obsidian-950/90 backdrop-blur-2xl sm:static sm:bg-transparent -mx-4 px-4 py-4 sm:p-0 border-b border-white/5 sm:border-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between sm:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-primary-500/5">
                  <Sparkles size={18} className="text-primary-400" />
                </div>
                <h1 className="text-lg font-black text-white tracking-tight font-display">نقطة البيع</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group flex-1">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن أصناف..."
                  className="input !bg-white/5 !border-white/10 !rounded-2xl pr-11 pl-20 !w-full text-sm font-bold"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {showScanner ? (
                    <button onClick={() => setShowScanner(false)} className="p-2 rounded-xl bg-rose-500/10 text-rose-400 active:scale-95 transition-all"><X size={18} /></button>
                  ) : (
                    <button onClick={() => setShowScanner(true)} className="p-2 rounded-xl bg-primary-500/10 text-primary-400 active:scale-95 transition-all"><Camera size={18} /></button>
                  )}
                  <button onClick={startVoiceSearch} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-white/5 text-slate-500'}`}>
                    <Mic size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar sm:hidden">
              <button onClick={() => setCat('')} className={`category-pill ${!catFilter ? 'category-pill-active' : 'category-pill-inactive'}`}>الكل</button>
              {categoriesList.map(c => (
                <button key={c} onClick={() => setCat(c)} className={`category-pill ${catFilter === c ? 'category-pill-active' : 'category-pill-inactive'}`}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Scanner UI */}
        <AnimatePresence>
          {showScanner && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="overflow-hidden bg-black/60 backdrop-blur-xl rounded-[2rem] border border-white/10 p-4 relative mb-4">
              <div id="reader" className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-black min-h-[250px] shadow-2xl"></div>
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ضع الباركود أمام الكاميرا</p>
                <label className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold cursor-pointer transition-all">
                  <Camera size={16} /> اختيار صورة باركود
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-6">
          {filtered.map(p => (
            <motion.button variants={itemVariant} onClick={() => handleCartAdd(p)} key={p.id}
              className="mobile-card-premium flex flex-row items-center p-3 sm:p-6 group active:bg-electric-500/5 h-24 sm:h-auto">
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-white font-black text-base sm:text-xl truncate font-display leading-snug">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                  <span className="text-xs sm:text-xs text-white font-black bg-white/20 px-2.5 py-1 rounded-lg border border-white/20 uppercase tracking-tighter">{p.category || 'عام'}</span>
                  <span className="text-xs sm:text-xs text-emerald-300 font-black drop-shadow-md">متاح: {p.quantity}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 px-4 border-r border-white/20 h-14 justify-center">
                <span className="text-xl sm:text-2xl font-black text-white font-display tracking-tight whitespace-nowrap drop-shadow-lg">
                  {Number(p.price).toLocaleString('en-US')}
                  <span className="text-xs sm:text-xs text-slate-300 font-bold mr-1">ج.م</span>
                </span>
              </div>
              <div className="ml-1">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(249,115,22,0.3)] group-active:scale-90 transition-transform">
                  <Plus size={20} className="sm:w-8 sm:h-8" />
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20">
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">لم يتم العثور على نتائج</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Desktop Side Cart */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[420px] 2xl:w-[450px] shrink-0 hidden xl:block">
        <div className="card !p-0 flex flex-col h-[calc(100vh-120px)] sticky top-4 border-white/10 shadow-premium overflow-hidden bg-obsidian-900/40 backdrop-blur-3xl">
          <CartContent {...cartProps} />
        </div>
      </motion.div>

      {/* Floating Mobile Cart Bar */}
      <AnimatePresence>
        {!isCartOpen && cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 inset-x-4 h-18 bg-white text-slate-900 rounded-[2rem] flex items-center justify-between px-6 z-[45] xl:hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20 active:scale-[0.98] transition-all"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart size={22} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-black w-6 h-6 rounded-xl border-4 border-white flex items-center justify-center">{cart.length}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1 opacity-70">إجمالي الطلب</p>
                <p className="text-xl font-black text-slate-950 font-display leading-none tracking-tight">{cartTotal.toLocaleString('en-US')} <span className="text-xs font-normal opacity-50">ج.م</span></p>
              </div>
            </div>
            <div className="bg-slate-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-wider">
              عرض السلة <ChevronLeft size={16} className="-rotate-90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Cart */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] xl:hidden" onClick={() => setIsCartOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 inset-x-0 h-[88vh] bg-obsidian-950 rounded-t-[3rem] z-[110] xl:hidden overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,1)] border-t border-white/5"
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 active:bg-white/20 transition-all" onClick={() => setIsCartOpen(false)} />
              <CartContent {...cartProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
