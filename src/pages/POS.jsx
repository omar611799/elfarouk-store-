import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Search, Plus, Minus, Trash2, ShoppingCart, Send, MessageCircle, Mic, CreditCard, Banknote, Smartphone, CalendarClock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const itemVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
}

const SYNONYM_MAP = [
  ['تيل', 'قماش', 'بادات'],
  ['مساعد', 'مساعدين', 'ساسبينشن'],
  ['بوجيه', 'شمعة', 'بوجيهات'],
  ['فانوس', 'كشاف', 'لمبة'],
  ['سير', 'قشاط', 'حزام'],
  ['طنبورة', 'طنابير', 'ديسك'],
  ['كبلن', 'كبالن'],
  ['مقص', 'مقصات']
]

const getSearchTerms = (str) => {
  if (!str) return []
  const words = str.toLowerCase().trim().split(/\s+/)
  const terms = new Set(words)
  words.forEach(w => {
    SYNONYM_MAP.forEach(group => {
      if (group.some(syn => syn.includes(w) || w.includes(syn))) {
        group.forEach(syn => terms.add(syn))
      }
    })
  })
  return Array.from(terms)
}

export default function POS() {
  const { products, cart, cartAdd, cartQty, cartRemove, cartClear, cartTotal, completeSale } = useStore()

  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' })
  
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '' })
  const [reminders, setReminders] = useState({}) // { productId: months }
  const [saving, setSaving]   = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [isListening, setIsListening] = useState(false)

  const filtered = useMemo(() => {
    const terms = getSearchTerms(search)
    return products.filter(p => {
      if (p.quantity <= 0) return false
      if (catFilter && p.category !== catFilter) return false
      if (terms.length === 0) return true
      return terms.some(t => p.name?.toLowerCase().includes(t) || p.sku?.toLowerCase().includes(t))
    })
  }, [products, search, catFilter])

  const totalPaid = Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)
  const due = Math.max(0, cartTotal - totalPaid)

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('متصفحك لا يدعم ميزة البحث الصوتي')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-EG'
    recognition.interimResults = false
    
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('لم نتمكن من التقاط الصوت')
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
      toast.success(`تم التقاط: ${transcript}`)
    }
    
    recognition.start()
  }

  const handleSale = async () => {
    if (cart.length === 0 || !customer.name) return
    setSaving(true)
    try {
      const invoiceNumber = `INV-${Date.now()}`
      const finalPayments = totalPaid === 0 ? { cash: cartTotal, visa: 0, instapay: 0 } : payments
      
      const invoiceReminders = Object.entries(reminders)
        .filter(([_, months]) => months > 0)
        .map(([id, months]) => {
          const item = cart.find(i => i.id === id)
          return { productId: id, name: item?.name || 'قطعة', months }
        })
      
      const id = await completeSale({
        cartItems: cart,
        customerData: { ...customer, payments: finalPayments, reminders: invoiceReminders },
        total: cartTotal,
        invoiceNumber,
      })

      setDoneInvoice({ id, number: invoiceNumber, total: cartTotal, customer, due: totalPaid === 0 ? 0 : due })
      setCustomer({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' })
      setPayments({ cash: '', visa: '', instapay: '' })
      setReminders({})
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
      `${doneInvoice.due > 0 ? `المتبقي الآجل: ${doneInvoice.due.toLocaleString()} ج.م\n` : ''}` +
      `📌رابط الفاتورة: ${window.location.origin}/receipt/${doneInvoice.id}\n` +
      `شكراً لتعاملكم معنا 🙏`
    const phone = doneInvoice.customer.phone ? doneInvoice.customer.phone.replace(/^0/, '20') : WHATSAPP
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const toggleReminder = (id) => {
    setReminders(prev => {
      const current = prev[id] || 0
      const next = current === 0 ? 1 : current === 1 ? 3 : current === 3 ? 6 : current === 6 ? 12 : 0
      return { ...prev, [id]: next }
    })
  }

  if (doneInvoice) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-4 pt-4 pb-10">
      <div className="glass-card text-center border-green-500/30 bg-green-500/[0.05] relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 bg-green-500/10 blur-[100px] pointer-events-none" />
        <h2 className="text-2xl font-bold text-white mb-1 relative z-10">تم البيع بنجاح! 🎉</h2>
        <p className="text-slate-400 text-sm relative z-10">فاتورة #{doneInvoice.number}</p>
        
        {/* QR Code */}
        <div className="bg-white p-3 rounded-2xl mx-auto my-4 shadow-lg shadow-green-500/20 relative z-10 transition-transform hover:scale-105">
          <QRCodeSVG value={`${window.location.origin}/receipt/${doneInvoice.id}`} size={140} />
        </div>
        <p className="text-xs text-green-400 font-bold mb-2 relative z-10">دع العميل يمسح الـ QR لحفظ فاتورته الرقمية 📱</p>
        
        <p className="text-3xl font-bold text-primary-400 mt-2 relative z-10">{doneInvoice.total.toLocaleString()} ج.م</p>
        {doneInvoice.due > 0 && <p className="text-red-400 text-sm mt-1 font-bold relative z-10">متبقي: {doneInvoice.due.toLocaleString()} ج.م</p>}
      </div>
      
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendWhatsApp} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-glow">
        <MessageCircle size={20} /> إرسال عبر واتساب
      </motion.button>
      <button onClick={() => setDoneInvoice(null)} className="btn-ghost w-full text-sm py-3">
        بيع جديد
      </button>
    </motion.div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-4">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center justify-between">
          <span>نقطة البيع (POS)</span>
          <span className="text-xs text-primary-400 border border-primary-500/20 bg-primary-500/10 px-2 py-1 rounded-md">مزود بالذكاء الاصطناعي 🧠</span>
        </h1>

        <div className="flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute right-3 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم القطعة (مثال: قماش يظهر تيل)..." className="input pr-9 pl-12 text-sm w-full font-medium placeholder:font-normal" />
            
            <motion.button
              whileTap={{ scale: 0.9 }} onClick={startVoiceSearch}
              className={`absolute left-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(243,24,96,0.5)] animate-pulse' : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300'}`}
              title="تحدث للبحث"
            >
              <Mic size={16} />
            </motion.button>
          </div>
          <select value={catFilter} onChange={e => setCat(e.target.value)} className="input w-32 text-sm">
            <option value="">كافة الفئات</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(p => (
            <motion.button variants={itemVariant} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} key={p.id} onClick={() => cartAdd(p)}
              className="glass-card text-right hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left group">
              <p className="font-semibold text-white text-sm truncate">{p.name}</p>
              {p.category && <p className="text-xs text-primary-400/80 mt-0.5">{p.category}</p>}
              <p className="text-primary-400 font-bold mt-2 text-sm">{Number(p.price).toLocaleString()} ج.م</p>
              <span className={`text-xs ${p.quantity <= 5 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                متوفر: {p.quantity}
              </span>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-8 text-slate-500 text-sm glass-card border-dashed">لا توجد منتجات مطابقة لهذا البحث</div>
          )}
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-80 space-y-4 flex flex-col h-full lg:max-h-[calc(100vh-2rem)]">
        <div className="glass-card flex-1 overflow-hidden flex flex-col p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-white flex items-center gap-2 text-sm">
              <ShoppingCart size={16} className="text-primary-400" /> السلة
            </h2>
            {cart.length > 0 && <button onClick={cartClear} className="text-xs text-red-400 hover:text-red-300">مسح الكل</button>}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 text-sm text-center py-10">السلة فارغة</motion.p>
              ) : (
                cart.map(item => {
                  const rem = reminders[item.id] || 0;
                  return (
                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="flex flex-col bg-slate-800/40 border border-white/5 rounded-xl px-2 py-2 group transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-primary-400 font-bold mt-0.5">{Number(item.price).toLocaleString()} ج.م</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/20"><Minus size={12} className="text-slate-300" /></button>
                          <span className="text-white text-xs w-4 text-center font-bold">{item.qty}</span>
                          <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/20"><Plus size={12} className="text-slate-300" /></button>
                          <button onClick={() => cartRemove(item.id)} className="w-6 h-6 text-red-400 hover:bg-red-500/20 rounded-lg flex items-center justify-center ml-1"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      
                      {/* Reminder Toggle */}
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                        <button onClick={() => toggleReminder(item.id)} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${rem > 0 ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                          <CalendarClock size={12} />
                          {rem === 0 ? 'بدون تذكير للصيانة' : rem === 1 ? 'تنبيه بعد شهر' : rem === 3 ? 'تنبيه لـ ٣ شهور' : rem === 6 ? 'تنبيه لـ ٦ شهور' : 'سنة كاملة'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>

          {cart.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 shrink-0">
              <div className="flex justify-between text-sm font-bold px-1">
                <span className="text-slate-300">الإجمالي</span>
                <span className="text-primary-400 tracking-wide text-base">{cartTotal.toLocaleString()} ج.م</span>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card space-y-3 shrink-0 p-3">
          <h2 className="font-bold text-white text-xs flex items-center gap-2">بيانات العميل والدفع</h2>
          <div className="space-y-1.5">
            <input value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} placeholder="الاسم *" className="input text-xs py-1.5" />
            <div className="flex gap-1.5">
              <input value={customer.carModel} onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))} placeholder="نوع العربية" className="input flex-1 text-xs py-1.5" />
              <input value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الهاتف" className="input flex-1 text-xs py-1.5" />
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Banknote size={14} className="text-emerald-400 w-5" />
              <input type="number" value={payments.cash} onChange={e => setPayments(p => ({...p, cash: e.target.value}))} placeholder="كاش" className="input flex-1 text-xs py-1.5 border-emerald-500/20 focus:border-emerald-500" />
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-blue-400 w-5" />
              <input type="number" value={payments.visa} onChange={e => setPayments(p => ({...p, visa: e.target.value}))} placeholder="فيزا" className="input flex-1 text-xs py-1.5 border-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-purple-400 w-5" />
              <input type="number" value={payments.instapay} onChange={e => setPayments(p => ({...p, instapay: e.target.value}))} placeholder="إنستا باي" className="input flex-1 text-xs py-1.5 border-purple-500/20 focus:border-purple-500" />
            </div>
            
            {(totalPaid > 0 || due > 0) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-between items-center text-xs px-1 pt-1 font-bold">
                <span className="text-slate-400">المدفوع: <span className="text-emerald-400">{totalPaid.toLocaleString()}</span></span>
                {due > 0 && <span className="text-red-400">آجل: {due.toLocaleString()}</span>}
              </motion.div>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSale} disabled={cart.length === 0 || !customer.name || saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-glow shrink-0"
        >
          <Send size={16} />
          {saving ? 'جار الحفظ...' : 'إتمام البيع والتأكيد'}
        </motion.button>
      </motion.div>
    </div>
  )
}
