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

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-black text-white font-display flex items-center gap-3">
            <ShoppingCart size={22} className="text-electric-400" />
            سلة البيع
        </h2>
        <div className="flex gap-4">
          {cart.length > 0 && <button onClick={cartClear} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors">مسح الكل</button>}
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide space-y-3 sm:space-y-4">
        <AnimatePresence>
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
                <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="bg-obsidian-950/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-black truncate font-display leading-tight">{item.name}</p>
                            <p className="text-[10px] text-electric-400 font-black mt-1 sm:mt-2 tracking-wide">{Number(item.price).toLocaleString('en-US')} ج.م</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 bg-obsidian-900 border border-white/5 rounded-xl sm:rounded-2xl p-1 sm:p-2 shrink-0">
                            <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={12} className="text-slate-400" /></button>
                            <span className="text-white text-sm font-black w-4 text-center">{item.qty}</span>
                            <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Plus size={12} className="text-slate-400" /></button>
                        </div>
                        <button onClick={() => cartRemove(item.id)} className="w-9 h-9 sm:w-10 sm:h-10 text-rose-500 hover:bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all px-2"><Trash2 size={16} /></button>
                    </div>
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 flex items-center gap-2">
                        <button onClick={() => toggleReminder(item.id)} className={`flex items-center gap-2 text-[9px] sm:text-[10px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 font-black uppercase tracking-tighter ${rem > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/5 text-slate-500 border border-transparent'}`}>
                        <CalendarClock size={12} />
                        {rem === 0 ? 'تذكير صيانة' : `تذكير بعد ${rem} شهر`}
                        </button>
                    </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 border-t border-white/5 bg-obsidian-950/20 backdrop-blur-md">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex justify-between items-center px-1">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">إجمالي السلة</span>
            <span className="text-3xl sm:text-4xl font-black text-white font-display tracking-tighter">{cartTotal.toLocaleString('en-US')} <span className="text-xs sm:text-sm font-normal text-slate-500">ج.م</span></span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
            <div className="relative group">
                <input 
                    value={customer.name} 
                    onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} 
                    placeholder="اسم العميل..." 
                    className="input !py-3 sm:!py-4 pr-10 sm:pr-12 text-sm" 
                />
                <Users size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                
                {suggestedCustomers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-obsidian-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-premium z-50 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                    {suggestedCustomers.map(sc => (
                        <button key={sc.id} onClick={() => setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })}
                        className="w-full text-right px-4 sm:px-6 py-3 hover:bg-electric-500/10 transition-all flex justify-between items-center group">
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
                 <input value={customer.carModel} onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))} placeholder="نوع العربية" className="input !py-3 sm:!py-4 text-xs font-bold" />
                 <input value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الموبايل" className="input !py-3 sm:!py-4 text-xs font-bold" />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="relative border border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl sm:rounded-2xl group focus-within:border-emerald-500/40 transition-colors">
                    <Banknote size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/30" />
                    <input type="number" value={payments.cash} onChange={e => setPayments(p => ({...p, cash: e.target.value}))} placeholder="كاش" className="w-full bg-transparent border-none focus:ring-0 pr-8 pl-2 py-3 sm:py-4 text-[10px] font-black text-emerald-400 placeholder-emerald-500/30" />
                </div>
                 <div className="relative border border-blue-500/10 bg-blue-500/[0.02] rounded-xl sm:rounded-2xl group focus-within:border-blue-500/40 transition-colors">
                    <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500/30" />
                    <input type="number" value={payments.visa} onChange={e => setPayments(p => ({...p, visa: e.target.value}))} placeholder="فيزا" className="w-full bg-transparent border-none focus:ring-0 pr-8 pl-2 py-3 sm:py-4 text-[10px] font-black text-blue-400 placeholder-blue-500/30" />
                </div>
                <div className="relative border border-purple-500/10 bg-purple-500/[0.02] rounded-xl sm:rounded-2xl group focus-within:border-purple-500/40 transition-colors">
                    <Smartphone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/30" />
                    <input type="number" value={payments.instapay} onChange={e => setPayments(p => ({...p, instapay: e.target.value}))} placeholder="إنستا" className="w-full bg-transparent border-none focus:ring-0 pr-8 pl-2 py-3 sm:py-4 text-[10px] font-black text-purple-400 placeholder-purple-500/30" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateQuotation} disabled={cart.length === 0 || !customer.name || saving}
                    className="btn-ghost !py-3 sm:!py-4 opacity-70 hover:opacity-100 disabled:opacity-20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    حفظ كعرض سعر
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSale} disabled={cart.length === 0 || !customer.name || saving}
                    className="btn-primary !py-3 sm:!py-4 flex-1 text-xs sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-neon disabled:opacity-20">
                    <Send size={16} /> {saving ? 'جار الحفظ...' : 'إتمام البيع'}
                </motion.button>
            </div>
        </div>
      </div>
    </div>
  )

  if (doneInvoice) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-10 sm:py-20 px-4 sm:px-6">
      <div className="card text-center relative overflow-hidden flex flex-col items-center py-10 sm:py-16">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 border border-emerald-500/20 shadow-neon">
          <Send size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3 font-display">تم البيع بنجاح!</h2>
        <p className="text-slate-500 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-8 sm:mb-10">إيصال رقم: {doneInvoice.number}</p>
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] mx-auto mb-8 sm:mb-10 shadow-premium group transition-transform hover:scale-105 border-4 sm:border-8 border-white/5">
          <QRCodeSVG value={`${window.location.origin}/receipt/${doneInvoice.id}`} size={200} />
        </div>
        
        <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-4 font-display">
            {doneInvoice.total.toLocaleString('en-US')} <span className="text-lg sm:text-2xl text-slate-500 font-normal">ج.م</span>
        </p>

        {doneInvoice.due > 0 && (
            <div className="badge-red mb-8 py-1.5 px-4 !text-[10px]">المتبقي الآجل: {doneInvoice.due.toLocaleString('en-US')} ج.م</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mt-4 sm:mt-6 px-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendWhatsApp} className="btn-primary !bg-green-600 hover:!bg-green-500 !shadow-[0_0_20px_rgba(22,163,74,0.4)]">
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
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 pb-32 pt-2 sm:pt-4">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                        <Sparkles size={20} className="text-electric-400" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display">معرض قطع الغيار</h1>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest hidden sm:block">اختر القطع المطلوبة لبدء العملية</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="input pr-10 pl-24 !w-full sm:!w-64 text-sm" />
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex gap-1">
                            <button onClick={() => setShowScanner(!showScanner)} className={`p-1.5 rounded-lg transition-all ${showScanner ? 'bg-emerald-500/20 text-emerald-400 shadow-neon' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                                <Camera size={16} />
                            </button>
                            <button onClick={startVoiceSearch} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                    <select value={catFilter} onChange={e => setCat(e.target.value)} className="input !w-32 text-[10px] font-black uppercase tracking-widest hidden sm:block">
                        <option value="">كافة الفئات</option>
                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Mobile Category Scroller */}
            <div className="flex flex-col gap-3 sm:hidden px-1">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تصفية حسب الفئة</span>
                  {catFilter && <button onClick={() => setCat('')} className="text-[9px] font-black text-rose-400 uppercase tracking-widest">مسح</button>}
               </div>
               <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4">
                  <button onClick={() => setCat('')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!catFilter ? 'bg-electric-600 text-white shadow-neon border-electric-400/20' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
                    الكل
                  </button>
                  {categoriesList.map(c => (
                    <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${catFilter === c ? 'bg-electric-600 text-white shadow-neon border-electric-400/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                      {c}
                    </button>
                  ))}
               </div>
            </div>
        </div>

        {showScanner && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden card !p-4 !bg-black/80 border-emerald-500/20 relative">
                <div className={`${scannerError ? 'hidden' : 'block'} mb-4`}>
                  <div id="reader" className="w-full max-w-sm mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-black/50 min-h-[200px] sm:min-h-[250px]"></div>
                </div>
                {scannerError && (
                  <div className="w-full max-w-sm mx-auto text-center py-4">
                    <Camera size={20} className="text-rose-400 mx-auto mb-2" />
                    <p className="text-slate-300 text-xs px-4 mb-4">{scannerError}</p>
                    <button onClick={() => setRetryCamera(c => c + 1)} className="btn-ghost !py-2 text-[10px]">إعادة المحاولة</button>
                  </div>
                )}
                <div className="w-full max-w-sm mx-auto text-center border-t border-white/10 pt-4 mt-2">
                  <label className="btn-primary !bg-electric-600 hover:!bg-electric-500 cursor-pointer inline-flex items-center justify-center w-full max-w-[180px] text-xs">
                    رفع صورة الباركود
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <button onClick={() => { setShowScanner(false); setScannerError(null); }} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 p-1.5 rounded-full z-50"><X size={14} /></button>
            </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(p => (
            <motion.button variants={itemVariant} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }} key={p.id} onClick={() => cartAdd(p)}
              className="card !p-0 flex flex-col group overflow-hidden border-white/5 hover:border-electric-500/30 text-right">
              <div className="absolute top-3 left-3 bg-obsidian-950/80 backdrop-blur-md border border-white/5 px-2.5 py-0.5 rounded-full z-10">
                <p className="text-[8px] sm:text-[9px] font-black text-electric-400 uppercase tracking-widest">{p.category || 'عام'}</p>
              </div>
              <div className="p-4 sm:p-6 pt-10 sm:pt-12 flex-1 flex flex-col items-end transition-all duration-500 bg-gradient-to-br from-transparent to-white/[0.01] group-hover:to-electric-500/[0.05]">
                <h3 className="text-white font-black text-sm sm:text-lg mb-1.5 group-hover:text-electric-400 transition-colors font-display text-right w-full leading-snug">{p.name}</h3>
                <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-4 truncate w-full">SKU: {p.sku || 'N/A'}</p>
                
                <div className="mt-auto w-full flex items-center justify-between border-t border-white/5 pt-3 sm:pt-4">
                  <div className={`flex flex-col items-start ${p.quantity <= 5 ? 'animate-pulse' : ''}`}>
                    <span className="text-[7px] sm:text-[8px] text-slate-600 font-black uppercase tracking-widest mb-0.5 sm:mb-1">المتوفر</span>
                    <span className={`text-[9px] sm:text-[10px] font-black ${p.quantity <= 5 ? 'text-rose-400' : 'text-slate-400'}`}>{p.quantity} قطعة</span>
                  </div>
                   <div className="flex flex-col items-end">
                    <span className="text-[7px] sm:text-[8px] text-slate-600 font-black uppercase tracking-widest mb-0.5 sm:mb-1">السعر</span>
                    <span className="text-base sm:text-xl font-black text-white font-display">{Number(p.price).toLocaleString('en-US')} <span className="text-[8px] sm:text-[10px] text-slate-500 font-normal">ج.م</span></span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 sm:py-32 text-center opacity-20">
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-sm">لم يتم العثور على قطع تطابق بحثك</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Main Cart Area (Desktop only sidebar) */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[420px] 2xl:w-[450px] shrink-0 hidden xl:block">
        <div className="card !p-0 flex flex-col h-[calc(100vh-160px)] sticky top-8">
           <CartContent />
        </div>
      </motion.div>

      {/* Floating Mobile Cart Summary Bar */}
      <AnimatePresence>
        {!isCartOpen && cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 inset-x-4 h-16 bg-electric-600 rounded-2xl flex items-center justify-between px-6 z-30 xl:hidden shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-white/10 active:scale-95 transition-transform" onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                  <ShoppingCart size={20} className="text-white" />
               </div>
               <div>
                  <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest leading-none mb-1">عدد الأصناف: {cart.length}</p>
                  <p className="text-lg font-black text-white font-display leading-none">{cartTotal.toLocaleString('en-US')} ج.م</p>
               </div>
            </div>
            <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
               عرض السلة <ChevronLeft size={16} className="-rotate-90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Bottom Sheet Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] xl:hidden" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 h-[85vh] bg-obsidian-950 border-t border-white/10 rounded-t-[2.5rem] z-[70] xl:hidden overflow-hidden flex flex-col pt-2 shadow-2xl">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-2" onClick={() => setIsCartOpen(false)} />
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
