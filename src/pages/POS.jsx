import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, Users, 
  ChevronLeft, Send, MessageCircle, Banknote, CreditCard, 
  Smartphone, Package, Camera, Mic, Sparkles, CalendarClock
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'

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

export default function POS() {
  const { 
    products, cart, cartAdd, cartRemove, cartQty, cartClear, cartTotal, 
    completeSale, saveQuote, customers 
  } = useStore()

  const [search, setSearch] = useState('')
  const [catFilter, setCat] = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '' })
  const [saving, setSaving] = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState(null)
  const [retryCamera, setRetryCamera] = useState(0)
  const [isListening, setIsListening] = useState(false)

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [reminders, setReminders] = useState({}) // { productId: months }

  const categoriesList = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))]
  }, [products])

  const getSearchTerms = (str) => {
    return str.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
  }

  const filtered = useMemo(() => {
    const terms = getSearchTerms(search)
    return products.filter(p => {
      // Don't show out of stock in POS
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

  const toggleReminder = (itemId) => {
    setReminders(prev => {
      const current = prev[itemId] || 0
      let next = 0
      if (current === 0) next = 3
      else if (current === 3) next = 6
      else if (current === 6) next = 12
      else next = 0
      return { ...prev, [itemId]: next }
    })
  }

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

      const newInv = { id: invId, number: invNum, total: cartTotal, due: dueAmount > 0 ? dueAmount : 0 }
      setDoneInvoice(newInv)
      
      // Reset State
      setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
      setPayments({ cash: '', visa: '', instapay: '' })
      setReminders({})
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateQuotation = async () => {
    if (cart.length === 0 || !customer.name) return
    setSaving(true)
    try {
      await saveQuote({
        customerData: customer,
        items: cart,
        total: cartTotal,
        createdAt: new Date()
      })
      cartClear()
      setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
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

  // Scanner & Voice Search Placeholder/Logic
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const html5QrCode = new Html5Qrcode("reader")
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        setSearch(decodedText)
        setShowScanner(false)
      })
      .catch(err => setScannerError("فشل قراءة الملف. تأكد من وضوح الباركود."))
  }

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("متصفحك لا يدعم البحث الصوتي")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleCartAdd = (p) => {
    cartAdd(p);
    // Haptic feedback for "App" feel
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }
  };

  const CartContent = () => (
    <div className="flex flex-col h-full bg-obsidian-950/20">
      <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-obsidian-900/80 backdrop-blur-xl z-20">
        <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-3">
            <ShoppingCart size={20} className="text-electric-400" />
            سلة البيع
        </h2>
        <div className="flex gap-4 items-center">
          {cart.length > 0 && <button onClick={cartClear} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors">مسح الكل</button>}
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-white bg-white/5 rounded-full"><X size={18} /></button>
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
            cart.map(item => {
              const rem = reminders[item.id] || 0;
              return (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -50 }}
                  drag="x"
                  dragConstraints={{ left: -100, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -80) {
                      cartRemove(item.id);
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                    }
                  }}
                  key={item.id} 
                  className="bg-obsidian-900/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 hover:border-white/10 transition-all group touch-pan-y"
                >
                    <div className="flex items-center gap-3 sm:gap-4 pointer-events-none">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-black truncate font-display leading-tight">{item.name}</p>
                            <p className="text-[10px] text-electric-400 font-black mt-1 sm:mt-2 tracking-wide font-display">{Number(item.price).toLocaleString('en-US')} ج.م</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 bg-obsidian-950 border border-white/5 rounded-xl sm:rounded-2xl p-1 sm:p-2 shrink-0 pointer-events-auto">
                            <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={12} className="text-slate-400" /></button>
                            <span className="text-white text-xs sm:text-sm font-black w-4 text-center">{item.qty}</span>
                            <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Plus size={12} className="text-slate-400" /></button>
                        </div>
                        <button onClick={() => cartRemove(item.id)} className="w-9 h-9 sm:w-10 sm:h-10 text-rose-500 hover:bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all px-2 pointer-events-auto hidden sm:flex"><Trash2 size={16} /></button>
                        <div className="sm:hidden text-rose-500/30 text-[8px] font-black uppercase tracking-widest pl-2">اسحب للحذف</div>
                    </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 border-t border-white/5 bg-obsidian-950/40 backdrop-blur-3xl pb-safe">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex justify-between items-center px-1">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">إجمالي السلة</span>
            <span className="text-2xl sm:text-4xl font-black text-white font-display tracking-tighter">{cartTotal.toLocaleString('en-US')} <span className="text-xs sm:text-sm font-normal text-slate-500">ج.م</span></span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
            <div className="relative group">
                <input 
                    value={customer.name} 
                    onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} 
                    placeholder="اسم العميل..." 
                    className="input !py-4 pr-12 text-sm" 
                />
                <Users size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                
                {suggestedCustomers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-obsidian-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-premium z-50 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                    {suggestedCustomers.map(sc => (
                        <button key={sc.id} onClick={() => setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })}
                        className="w-full text-right px-4 sm:px-6 py-3.5 hover:bg-electric-500/10 transition-all flex justify-between items-center group">
                          <div className="flex items-center gap-2">
                              <ChevronLeft size={14} className="text-slate-700 group-hover:text-electric-400 group-hover:-translate-x-1 transition-all" />
                              <span className="text-electric-400 font-black text-[9px] uppercase tracking-widest">{sc.phone}</span>
                          </div>
                          <span className="text-white text-xs sm:text-sm font-black font-display">{sc.name}</span>
                        </button>
                    ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                 <input value={customer.carModel} onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))} placeholder="نوع العربية" className="input !py-4 text-sm font-bold" />
                 <input value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الموبايل" className="input !py-4 text-sm font-bold" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSale} disabled={cart.length === 0 || !customer.name || saving}
                    className="btn-primary !py-4 flex-1 text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-neon disabled:opacity-20 active:scale-95">
                    <Send size={18} /> {saving ? 'جار الحفظ...' : 'إتمام البيع'}
                </motion.button>
            </div>
        </div>
      </div>
    </div>
  )

  if (doneInvoice) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-10 px-4">
      <div className="card text-center relative overflow-hidden flex flex-col items-center py-10 sm:py-16">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 border border-emerald-500/20 shadow-neon">
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
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 pb-40 pt-2 sm:pt-4">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-6 sm:space-y-8">
        
        {/* Sticky Mobile Search Header */}
        <div className="sticky top-0 z-[40] bg-obsidian-950/80 backdrop-blur-xl sm:static sm:bg-transparent -mx-4 px-4 py-3 sm:p-0 border-b border-white/5 sm:border-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                        <Sparkles size={20} className="text-electric-400" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-3xl font-black text-white tracking-tight font-display">نقطة البيع</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم القطعة أو الكود..." className="input pr-11 pl-20 !w-full sm:!w-72 text-sm" />
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <button onClick={() => setShowScanner(!showScanner)} className={`p-1.5 rounded-lg transition-all ${showScanner ? 'bg-emerald-500/20 text-emerald-400 shadow-neon' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                                <Camera size={16} />
                            </button>
                            <button onClick={startVoiceSearch} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Category Horizontal Scroller */}
            <div className="flex overflow-x-auto gap-2 pb-1 pt-3 scrollbar-hide sm:hidden">
              <button onClick={() => setCat('')} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${!catFilter ? 'bg-electric-600 text-white border-electric-500 shadow-neon' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                الكل
              </button>
              {categoriesList.map(c => (
                <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${catFilter === c ? 'bg-electric-600 text-white border-electric-500 shadow-neon' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                  {c}
                </button>
              ))}
            </div>
        </div>

        {showScanner && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden card !p-4 !bg-black/80 border-emerald-500/20 relative">
                <div className={`${scannerError ? 'hidden' : 'block'} mb-4`}>
                  <div id="reader" className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-black/50 min-h-[250px]"></div>
                </div>
                {scannerError && (
                  <div className="w-full max-w-sm mx-auto text-center py-4">
                    <Camera size={20} className="text-rose-400 mx-auto mb-2" />
                    <p className="text-slate-300 text-xs px-4 mb-4">{scannerError}</p>
                    <button onClick={() => setRetryCamera(c => c + 1)} className="btn-ghost !py-2 text-[10px]">إعادة المحاولة</button>
                  </div>
                )}
                <div className="w-full max-w-sm mx-auto text-center border-t border-white/10 pt-4">
                  <label className="btn-primary !bg-electric-600 hover:!bg-electric-500 cursor-pointer inline-flex items-center justify-center w-full max-w-[200px] text-xs">
                    فتح الكاميرا للباركود
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <button onClick={() => { setShowScanner(false); setScannerError(null); }} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 p-2 rounded-full z-50"><X size={16} /></button>
            </motion.div>
        )}

        {/* Mobile List View / Desktop Grid View */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-6">
          {filtered.map(p => (
            <motion.button variants={itemVariant} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} key={p.id} onClick={() => handleCartAdd(p)}
              className="card !p-0 flex flex-row sm:flex-col group overflow-hidden border-white/5 hover:border-electric-500/30 text-right h-16 sm:h-auto items-center sm:items-stretch active:bg-white/[0.02]">
              
              <div className="hidden sm:block absolute top-3 left-3 bg-obsidian-950/80 backdrop-blur-md border border-white/5 px-2.5 py-0.5 rounded-full z-10">
                <p className="text-[8px] sm:text-[9px] font-black text-electric-400 uppercase tracking-widest">{p.category || 'عام'}</p>
              </div>

              {/* Mobile Swipe-like Info Area */}
              <div className="flex-1 px-4 sm:p-6 sm:pt-12 text-right">
                <h3 className="text-white font-black text-xs sm:text-lg truncate font-display leading-tight">{p.name}</h3>
                <p className="text-slate-600 text-[8px] sm:text-[10px] font-black uppercase tracking-widest truncate sm:mt-1">SKU: {p.sku || 'N/A'}</p>
              </div>

              <div className="px-4 sm:p-6 sm:pt-0 shrink-0 sm:mt-auto border-r sm:border-r-0 sm:border-t border-white/5 flex flex-col justify-center items-end h-full">
                <div className="sm:hidden text-[7px] text-slate-600 font-bold uppercase tracking-widest mb-0.5 leading-none">السعر</div>
                <span className="text-sm sm:text-xl font-black text-white font-display leading-none">{Number(p.price).toLocaleString('en-US')} <span className="text-[8px] sm:text-[10px] text-slate-500 font-normal">ج.م</span></span>
                <div className="hidden sm:block text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">متوفر: {p.quantity}</div>
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

      {/* Desktop Cart Aside */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[420px] 2xl:w-[450px] shrink-0 hidden xl:block">
        <div className="card !p-0 flex flex-col h-[calc(100vh-160px)] sticky top-8 border-white/10 shadow-premium overflow-hidden bg-obsidian-900/40 backdrop-blur-3xl">
           <CartContent />
        </div>
      </motion.div>

      {/* Floating Mobile Cart Bar */}
      <AnimatePresence>
        {!isCartOpen && cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 inset-x-4 h-16 bg-electric-600 rounded-2xl flex items-center justify-between px-6 z-[45] xl:hidden shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-white/20 active:scale-95 transition-transform" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10">
                  <ShoppingCart size={20} className="text-white" />
               </div>
               <div>
                  <p className="text-[9px] text-blue-100 font-black uppercase tracking-widest leading-none mb-1 opacity-70">عدد الأصناف: {cart.length}</p>
                  <p className="text-lg font-black text-white font-display leading-none tracking-tight">{cartTotal.toLocaleString('en-US')} ج.م</p>
               </div>
            </div>
            <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-90">
               عرض السلة <ChevronLeft size={16} className="-rotate-90 animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] xl:hidden" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 inset-x-0 h-[92vh] bg-obsidian-950 rounded-t-[2.5rem] z-[110] xl:hidden overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.8)] border-t border-white/5">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3" onClick={() => setIsCartOpen(false)} />
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
}
