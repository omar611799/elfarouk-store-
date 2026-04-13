import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { Search, Plus, Minus, Trash2, ShoppingCart, Send, MessageCircle, Mic, CreditCard, Banknote, Smartphone, CalendarClock, Camera, Sparkles, X, ChevronLeft, Users } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '201115329887'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
  const { products, customers, cart, cartAdd, cartQty, cartRemove, cartClear, cartTotal, completeSale, saveQuote } = useStore()

  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' })
  
  useEffect(() => {
    const pending = localStorage.getItem('pendingQuoteCustomer');
    if (pending) {
      setCustomer(JSON.parse(pending));
      localStorage.removeItem('pendingQuoteCustomer');
    }
  }, []);
  
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '' })
  const [reminders, setReminders] = useState({}) 
  const [saving, setSaving]   = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const filtered = useMemo(() => {
    const terms = getSearchTerms(search)
    return products.filter(p => {
      if (p.quantity <= 0) return false
      if (catFilter && p.category !== catFilter) return false
      if (terms.length === 0) return true
      return terms.some(t => p.name?.toLowerCase().includes(t) || p.sku?.toLowerCase().includes(t))
    })
  }, [products, search, catFilter])

  const suggestedCustomers = useMemo(() => {
    if (!customer.name && !customer.phone) return [];
    if (customer.name.length < 2 && customer.phone.length < 3) return [];
    return customers.filter(c => 
      c.name?.toLowerCase().includes(customer.name.toLowerCase()) || 
      c.phone?.includes(customer.phone)
    ).slice(0, 5);
  }, [customers, customer.name, customer.phone]);

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
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      toast.success(`تم البحث عن: ${transcript}`, { icon: '🎙️' });
    }
    recognition.start()
  }

  const [scannerError, setScannerError] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('reader');
      const decodedText = await html5QrCode.scanFileV2(file);
      const matched = products.find(p => p.sku === decodedText?.decodedText || p.id === decodedText?.decodedText);
      if (matched) {
        cartAdd(matched);
        toast.success(`تمت إضافة: ${matched.name}`, { icon: '📦' });
        setShowScanner(false);
        setScannerError(false);
      } else {
        toast.error(`كود غير معروف: ${decodedText?.decodedText}`);
      }
    } catch (err) {
      toast.error('لم يتم العثور على باركود في الصورة');
    }
  };

  useEffect(() => {
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      let html5QrCode = null;
      if (showScanner && !scannerError) {
        html5QrCode = new Html5Qrcode('reader');
        
        Html5Qrcode.getCameras().then(devices => {
          if (devices && devices.length > 0) {
            const cameraId = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
            
            html5QrCode.start(
              cameraId,
              { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
              (decodedText) => {
                const matched = products.find(p => p.sku === decodedText || p.id === decodedText);
                if (matched) {
                  cartAdd(matched);
                  toast.success(`تمت إضافة: ${matched.name}`, { icon: '📦' });
                  setShowScanner(false);
                } else {
                  toast.error(`كود غير معروف: ${decodedText}`);
                }
              },
              (errorMessage) => {}
            ).catch(err => {
              console.error("Camera start error:", err);
              setScannerError(true);
            });
          } else {
            console.error("No cameras found");
            setScannerError(true);
          }
        }).catch(err => {
          console.error("Permission error:", err);
          setScannerError(true);
        });
      }
      
      window._currentQrCode = html5QrCode;
    });

    return () => { 
      if (window._currentQrCode) {
        window._currentQrCode.stop().then(() => {
          window._currentQrCode.clear();
        }).catch(() => {});
      }
    };
  }, [showScanner, scannerError, products, cartAdd]);

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

  const handleCreateQuotation = async () => {
    if (cart.length === 0 || !customer.name) return;
    setSaving(true);
    try {
      await saveQuote({
        number: `QTE-${Date.now()}`,
        items: cart,
        total: cartTotal,
        customerData: customer,
        createdAt: new Date(),
      });
      cartClear();
      setCustomer({ name: '', phone: '', nationalId: '', carModel: '', licensePlate: '' });
      toast.success('تم حفظ عرض السعر بنجاح');
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsApp = () => {
    if (!doneInvoice) return
    const msg = `🧾 فاتورة من الفاروق ستور\nرقم الفاتورة: ${doneInvoice.number}\nالعميل: ${doneInvoice.customer.name}\nالإجمالي: ${doneInvoice.total.toLocaleString('en-US')} ج.م\n📌رابط الفاتورة: ${window.location.origin}/receipt/${doneInvoice.id}\nشكراً لتعاملكم معنا 🙏`
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
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-20 px-6">
      <div className="card text-center relative overflow-hidden flex flex-col items-center py-16">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-emerald-500/20 shadow-neon">
          <Send size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-4xl font-black text-white mb-3 font-display">تم البيع بنجاح!</h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-10">إيصال رقم: {doneInvoice.number}</p>
        
        <div className="bg-white p-6 rounded-[2.5rem] mx-auto mb-10 shadow-premium group transition-transform hover:scale-105 border-8 border-white/5">
          <QRCodeSVG value={`${window.location.origin}/receipt/${doneInvoice.id}`} size={200} />
        </div>
        
        <p className="text-5xl font-black text-white tracking-tighter mb-4 font-display">
            {doneInvoice.total.toLocaleString('en-US')} <span className="text-2xl text-slate-500 font-normal">ج.م</span>
        </p>

        {doneInvoice.due > 0 && (
            <div className="badge-red mb-10 py-2 px-6 !text-xs">المتبقي الآجل: {doneInvoice.due.toLocaleString('en-US')} ج.م</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendWhatsApp} className="btn-primary !bg-green-600 hover:!bg-green-500 !shadow-[0_0_20px_rgba(22,163,74,0.4)]">
                <MessageCircle size={20} /> واتساب العميل
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDoneInvoice(null)} className="btn-ghost">
                عملية بيع جديدة
            </motion.button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-20 pt-4">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                        <Sparkles size={22} className="text-electric-400" />
                    </div>
                    معرض قطع الغيار
                </h1>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2 ml-1">اختر القطع المطلوبة لبدء العملية</p>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="ابحث بالاسم أو الكود..." 
                        className="input pr-12 pl-28 !w-72 md:!w-96 text-sm" 
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={() => setShowScanner(!showScanner)} className={`p-2 rounded-xl transition-all ${showScanner ? 'bg-emerald-500/20 text-emerald-400 shadow-neon' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                            <Camera size={18} />
                        </button>
                        <button onClick={startVoiceSearch} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                            <Mic size={18} />
                        </button>
                    </div>
                </div>
                <select value={catFilter} onChange={e => setCat(e.target.value)} className="input !w-40 text-xs font-black uppercase tracking-widest">
                    <option value="">كافة الفئات</option>
                    {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
                    <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
        </div>

        {showScanner && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden card !p-4 !bg-black/80 border-emerald-500/20 relative">
                {!scannerError ? (
                  <div id="reader" className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-black/50 min-h-[250px]"></div>
                ) : (
                  <div className="w-full max-w-sm mx-auto text-center py-10">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                      <Camera size={24} className="text-rose-400" />
                    </div>
                    <p className="text-rose-400 font-bold mb-2">تعذر تشغيل الكاميرا!</p>
                    <p className="text-slate-400 text-xs mb-6 px-4">يرجى التأكد من صلاحيات المتصفح، أو يمكنك رفع صورة الباركود من الجهاز مباشرة.</p>
                    
                    <label className="btn-primary !bg-electric-600 hover:!bg-electric-500 cursor-pointer block w-full max-w-[200px] mx-auto text-sm">
                      رفع صورة الباركود
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
                <button onClick={() => { setShowScanner(false); setScannerError(false); }} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 p-2 rounded-full z-50"><X size={16} /></button>
            </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <motion.button variants={itemVariant} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.98 }} key={p.id} onClick={() => cartAdd(p)}
              className="card !p-0 flex flex-col group overflow-hidden border-white/5 hover:border-electric-500/30 text-right">
              <div className="absolute top-4 left-4 bg-obsidian-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full z-10">
                <p className="text-[10px] font-black text-electric-400 uppercase tracking-widest">{p.category || 'عام'}</p>
              </div>
              <div className="p-6 pt-12 flex-1 flex flex-col items-end transition-all duration-500 bg-gradient-to-br from-transparent to-white/[0.02] group-hover:to-electric-500/[0.05]">
                <h3 className="text-white font-black text-lg mb-2 group-hover:text-electric-400 transition-colors font-display text-right w-full leading-tight">{p.name}</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">SKU: {p.sku || 'N/A'}</p>
                
                <div className="mt-auto w-full flex items-center justify-between border-t border-white/5 pt-4">
                  <div className={`flex flex-col items-start ${p.quantity <= 5 ? 'animate-pulse' : ''}`}>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">المتوفر</span>
                    <span className={`text-[10px] font-black ${p.quantity <= 5 ? 'text-rose-400' : 'text-slate-300'}`}>{p.quantity} قطعة</span>
                  </div>
                   <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">السعر</span>
                    <span className="text-xl font-black text-white font-display">{Number(p.price).toLocaleString('en-US')} <span className="text-[10px] text-slate-500 font-normal">ج.م</span></span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-20">
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-sm">لم يتم العثور على قطع تطابق بحثك</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Cart & Sidbar */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[450px] shrink-0 space-y-6">
        <div className="card !p-0 flex flex-col h-[650px] sticky top-8">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black text-white font-display flex items-center gap-3">
                <ShoppingCart size={22} className="text-electric-400" />
                سلة البيع
            </h2>
            {cart.length > 0 && <button onClick={cartClear} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors">مسح الكل</button>}
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-none custom-scrollbar space-y-4">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                        <ShoppingCart size={40} className="text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">السلة فارغة حالياً</p>
                </div>
              ) : (
                cart.map(item => {
                  const rem = reminders[item.id] || 0;
                  return (
                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="bg-obsidian-950/40 rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-black truncate font-display leading-tight">{item.name}</p>
                                <p className="text-[10px] text-electric-400 font-black mt-2 tracking-wide">{Number(item.price).toLocaleString('en-US')} ج.م</p>
                            </div>
                            <div className="flex items-center gap-3 bg-obsidian-900 border border-white/5 rounded-2xl p-2 shrink-0">
                                <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Minus size={14} className="text-slate-400" /></button>
                                <span className="text-white text-sm font-black w-4 text-center">{item.qty}</span>
                                <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><Plus size={14} className="text-slate-400" /></button>
                            </div>
                            <button onClick={() => cartRemove(item.id)} className="w-10 h-10 text-rose-500 hover:bg-rose-500/10 rounded-2xl flex items-center justify-center transition-all"><Trash2 size={16} /></button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                            <button onClick={() => toggleReminder(item.id)} className={`flex items-center gap-2 text-[10px] px-4 py-2 rounded-xl transition-all duration-300 font-black uppercase tracking-tighter ${rem > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/5 text-slate-500 border border-transparent'}`}>
                            <CalendarClock size={14} />
                            {rem === 0 ? 'تعيين تذكير صيانة' : `تذكير بعد ${rem} شهر`}
                            </button>
                        </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 border-t border-white/5 bg-obsidian-950/20 backdrop-blur-md">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center px-1">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">إجمالي السلة</span>
                <span className="text-4xl font-black text-white font-display tracking-tighter">{cartTotal.toLocaleString('en-US')} <span className="text-sm font-normal text-slate-500">ج.م</span></span>
              </div>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <input 
                        value={customer.name} 
                        onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} 
                        placeholder="اسم العميل..." 
                        className="input !py-4 pr-12 text-sm" 
                    />
                    <Users size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric-400 transition-colors" />
                    
                    {suggestedCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-obsidian-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-premium z-50 overflow-hidden divide-y divide-white/5">
                        {suggestedCustomers.map(sc => (
                            <button 
                            key={sc.id} 
                            onClick={() => setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })}
                            className="w-full text-right px-6 py-4 hover:bg-electric-500/10 transition-all flex justify-between items-center group"
                            >
                            <div className="flex items-center gap-2">
                                <ChevronLeft size={16} className="text-slate-700 group-hover:text-electric-400 group-hover:-translate-x-1 transition-all" />
                                <span className="text-electric-400 font-black text-[10px] uppercase tracking-widest">{sc.phone}</span>
                            </div>
                            <span className="text-white text-sm font-black font-display">{sc.name}</span>
                            </button>
                        ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                         <input value={customer.carModel} onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))} placeholder="نوع العربية" className="input !py-4 text-xs font-bold" />
                    </div>
                    <div className="relative group">
                         <input value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الموبايل" className="input !py-4 text-xs font-bold" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="relative border border-emerald-500/10 bg-emerald-500/[0.02] rounded-2xl group focus-within:border-emerald-500/40 transition-colors">
                        <Banknote size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/30" />
                        <input type="number" value={payments.cash} onChange={e => setPayments(p => ({...p, cash: e.target.value}))} placeholder="كاش" className="w-full bg-transparent border-none focus:ring-0 pr-10 pl-4 py-4 text-xs font-black text-emerald-400 placeholder-emerald-500/30" />
                    </div>
                     <div className="relative border border-blue-500/10 bg-blue-500/[0.02] rounded-2xl group focus-within:border-blue-500/40 transition-colors">
                        <CreditCard size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500/30" />
                        <input type="number" value={payments.visa} onChange={e => setPayments(p => ({...p, visa: e.target.value}))} placeholder="فيزا" className="w-full bg-transparent border-none focus:ring-0 pr-10 pl-4 py-4 text-xs font-black text-blue-400 placeholder-blue-500/30" />
                    </div>
                    <div className="relative border border-purple-500/10 bg-purple-500/[0.02] rounded-2xl group focus-within:border-purple-500/40 transition-colors">
                        <Smartphone size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/30" />
                        <input type="number" value={payments.instapay} onChange={e => setPayments(p => ({...p, instapay: e.target.value}))} placeholder="إنستا" className="w-full bg-transparent border-none focus:ring-0 pr-10 pl-4 py-4 text-xs font-black text-purple-400 placeholder-purple-500/30" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                        onClick={handleCreateQuotation} disabled={cart.length === 0 || !customer.name || saving}
                        className="btn-ghost !py-4 opacity-50 hover:opacity-100 disabled:opacity-20 flex-1 text-[10px] font-black uppercase tracking-widest"
                    >
                        حفظ كعرض سعر
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSale} disabled={cart.length === 0 || !customer.name || saving}
                        className="btn-primary !py-4 flex-1 text-sm font-black uppercase tracking-[0.2em] shadow-neon disabled:opacity-20"
                    >
                        <Send size={18} />
                        {saving ? 'جار الحفظ...' : 'إتمام البيع'}
                    </motion.button>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
