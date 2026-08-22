import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, Users, 
  ChevronLeft, Send, MessageCircle, Camera, Sparkles,
  Wallet, CreditCard, Landmark, Wrench, Printer, AlertTriangle,
  Package, Receipt, FolderSync, Clock
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

/* ─── car list database ─── */
const POPULAR_CARS = [
  'تويوتا كورولا', 'تويوتا يارس', 'تويوتا هيلوكس', 'تويوتا فورتشنر',
  'هيونداي إلنترا', 'هيونداي أكسنت', 'هيونداي فيرنا', 'هيونداي توسان', 'هيونداي آي 10',
  'كيا سيراتو', 'كيا سبورتاج', 'كيا ريو', 'كيا بيكانتو',
  'ميتسوبيشي لانسر بومة', 'ميتسوبيشي لانسر شارك', 'ميتسوبيشي باجيرو',
  'شيفروليه أوبترا', 'شيفروليه أفيو', 'شيفروليه كروز', 'شيفروليه لانوس', 'شيفروليه الدبابة',
  'نيسان صني', 'نيسان سنترا', 'نيسان قشقاي',
  'رينو لوجان', 'رينو ميجان', 'رينو داستر',
  'فيات تيبو', 'فيات شاهين', 'فيات 128',
  'سكودا أوكتافيا', 'سكودا كودياك',
  'فولكس فاجن جولف', 'فولكس فاجن باسات',
  'أوبل أسترا', 'أوبل إنسينيا'
]

/* ─── animation variants ─── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
}
const itemVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 }
}

/* ─── category icon map ─── */
const catIcons = {
  'سوست': '🔩', 'زيوت': '🛢️', 'فلاتر': '🔧', 'بطاريات': '🔋',
  'فرامل': '⚙️', 'كاوتش': '🛞', 'إكسسوارات': '✨', 'كهرباء': '⚡',
  'عام': '📦', 'خدمات': '🔧',
}
const getCatIcon = (cat) => catIcons[cat] || '📦'

/* ═══════════════════════════════════════════════════════════════
   THERMAL RECEIPT — Realistic paper receipt with print support
   ═══════════════════════════════════════════════════════════════ */
const ThermalReceipt = memo(({ invoice, onNewSale }) => {
  const receiptRef = useRef(null)
  const [selectedTemplate, setSelectedTemplate] = useState('invoice')
  const [editedMsg, setEditedMsg] = useState('')

  const link = `${window.location.origin}/receipt/${invoice.id}`

  useEffect(() => {
    const name = invoice.customerName || 'العميل الكريم'
    const car = invoice.customerCar || 'السيارة المسجلة'
    const total = invoice.total?.toLocaleString('en-US') || '0'
    const due = invoice.due?.toLocaleString('en-US') || '0'
    const number = invoice.number || ''
    const items = invoice.items || []

    let text = ''
    if (selectedTemplate === 'invoice') {
      text = `🧾 فاتورة مبيعات من ELFAROUK Service\n` +
             `رقم الفاتورة: #${number}\n` +
             `العميل: أ/ ${name}\n` +
             `سيارة: ${car}\n` +
             `الإجمالي: ${total} ج.م\n` +
             (Number(invoice.due) > 0 ? `المتبقي (مديونية): ${due} ج.م\n` : '') +
             `رابط معاينة الفاتورة: ${link}\n\n` +
             `شكراً لتعاملكم معنا 🙏`
    } else if (selectedTemplate === 'maintenance') {
      text = `🔧 تقرير فحص وصيانة سيارة - ELFAROUK Service\n` +
             `العميل المحترم: أ/ ${name}\n` +
             `السيارة: ${car}\n` +
             `الأعمال المنجزة:\n` +
             items.map((it, idx) => `  ${idx + 1}. ${it}`).join('\n') + `\n\n` +
             `إجمالي التكلفة: ${total} ج.م\n` +
             `الفاتورة ورابط الفحص: ${link}\n\n` +
             `نتمنى لكم قيادة آمنة 🚗💨`
    } else if (selectedTemplate === 'reminder') {
      text = `🔔 تذكير صيانة دورية - ELFAROUK Service\n` +
             `مرحباً أ/ ${name} 👋\n` +
             `حبينا نفكر حضرتك بموعد الصيانة الوقائية القادم لسيارتك (${car}).\n` +
             `نوصي بمراجعة وتغيير القطع/الزيوت التي تم تركيبها لضمان سلامة سيارتك.\n` +
             `رابط آخر فاتورة صيانة ومعاينتها: ${link}\n\n` +
             `تشرفنا بزيارتك في أي وقت 🙏`
    }
    setEditedMsg(text)
  }, [invoice, selectedTemplate, link])

  const sendWhatsApp = () => {
    const phone = invoice.customerPhone?.replace(/^0/, '20') || '201115329887'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(editedMsg)}`, '_blank')
  }

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    printWindow.document.write(`
      <html dir="rtl"><head><title>فاتورة #${invoice.number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo',monospace; width:80mm; margin:0 auto; padding:8px; background:#fff; color:#000; font-size:11px; }
        .receipt-header { text-align:center; border-bottom:2px dashed #000; padding-bottom:12px; margin-bottom:12px; }
        .receipt-header h1 { font-size:18px; font-weight:900; letter-spacing:-0.5px; }
        .receipt-header p { font-size:10px; opacity:0.7; }
        .receipt-row { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dotted #ccc; }
        .receipt-row:last-child { border-bottom:none; }
        .receipt-total { border-top:2px dashed #000; margin-top:12px; padding-top:12px; font-weight:900; font-size:16px; text-align:center; }
        .receipt-footer { text-align:center; margin-top:16px; font-size:9px; opacity:0.6; border-top:2px dashed #000; padding-top:12px; }
        .receipt-zigzag { height:12px; background: linear-gradient(135deg, #fff 33.33%, transparent 33.33%) -12px 0, linear-gradient(225deg, #fff 33.33%, transparent 33.33%) -12px 0, linear-gradient(315deg, #fff 33.33%, transparent 33.33%), linear-gradient(45deg, #fff 33.33%, transparent 33.33%); background-size: 16px 12px; background-color:#eee; }
      </style></head><body>
        ${content.innerHTML}
        <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `)
    printWindow.document.close()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-6 px-3 sm:px-4" dir="rtl">
      {/* Thermal Receipt Preview */}
      <div className="relative">
        {/* Top zigzag edge */}
        <div className="receipt-zigzag-top h-4 w-full" />
        
        <div ref={receiptRef} className="bg-[#fefcf8] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative" style={{ fontFamily: "'Cairo', monospace" }}>
          {/* Receipt Header */}
          <div className="receipt-header text-center pb-5 mb-5" style={{ borderBottom: '2px dashed #d4d4d4' }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">ELFAROUK</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">SERVICE CENTER</p>
            <p className="text-[10px] text-slate-400 mt-2">{dateStr} — {timeStr}</p>
          </div>

          {/* Customer Info */}
          <div className="mb-4 space-y-1 text-xs text-slate-700">
            <div className="flex justify-between"><span className="text-slate-400">العميل:</span><span className="font-bold">{invoice.customerName}</span></div>
            {invoice.customerCar && <div className="flex justify-between"><span className="text-slate-400">السيارة:</span><span className="font-bold">{invoice.customerCar}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">رقم الفاتورة:</span><span className="font-bold">#{invoice.number}</span></div>
          </div>

          {/* Dashed separator */}
          <div style={{ borderTop: '1.5px dashed #d4d4d4' }} className="my-4" />

          {/* Items */}
          <div className="space-y-2">
            {(invoice.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1.5" style={{ borderBottom: '1px dotted #e5e5e5' }}>
                <span className="font-bold text-slate-800">{typeof item === 'string' ? item : item.name}</span>
                <span className="text-slate-500 font-mono">{typeof item === 'object' ? `${item.qty} × ${Number(item.price).toLocaleString()}` : ''}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ borderTop: '2px dashed #333' }} className="mt-5 pt-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">الإجمالي</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{invoice.total?.toLocaleString('en-US')} <span className="text-sm font-normal">ج.م</span></p>
          </div>

          {Number(invoice.due) > 0 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xs font-black text-red-600">⚠️ مديونية متبقية: {invoice.due?.toLocaleString('en-US')} ج.م</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center mt-6 mb-4">
            <QRCodeSVG value={link} size={100} />
          </div>

          {/* Footer */}
          <div style={{ borderTop: '2px dashed #d4d4d4' }} className="pt-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold">شكراً لتعاملكم معنا 🙏</p>
            <p className="text-[9px] text-slate-300 mt-1">ELFAROUK SERVICE CENTER</p>
          </div>
        </div>

        {/* Bottom zigzag edge */}
        <div className="receipt-zigzag-bottom h-4 w-full" />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePrint}
            className="btn-primary !bg-slate-900 hover:!bg-slate-800 !py-3.5 text-xs">
            <Printer size={16} /> طباعة الفاتورة
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendWhatsApp}
            className="btn-primary !bg-emerald-600 hover:!bg-emerald-500 !shadow-[0_10px_20px_rgba(16,185,129,0.2)] !py-3.5 text-xs">
            <MessageCircle size={16} /> إرسال واتساب
          </motion.button>
        </div>

        {/* WhatsApp Template Selector */}
        <div className="card !p-4 space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <MessageCircle size={14} className="text-primary-600" />
            قالب الرسالة
          </h4>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'invoice', label: '🧾 فاتورة' },
              { id: 'maintenance', label: '🔧 صيانة' },
              { id: 'reminder', label: '🔔 تذكير' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setSelectedTemplate(tab.id)}
                className={`py-2 text-[10px] sm:text-xs font-black rounded-lg transition-all ${
                  selectedTemplate === tab.id
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <textarea value={editedMsg} onChange={e => setEditedMsg(e.target.value)} rows={4}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-primary-500 focus:bg-white text-slate-800 outline-none leading-relaxed" dir="rtl" />
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onNewSale}
          className="w-full btn-ghost !py-4 text-sm font-black uppercase tracking-wider">
          <Plus size={18} /> عملية بيع جديدة
        </motion.button>
      </div>
    </motion.div>
  )
})
ThermalReceipt.displayName = 'ThermalReceipt'


/* ═══════════════════════════════════════════════════════════════
   CART CONTENT — Side panel / mobile bottom sheet
   ═══════════════════════════════════════════════════════════════ */
const CartContent = memo(({
  cart, cartTotal, cartClear, cartQty, cartRemove,
  customer, setCustomer, suggestedCustomers,
  payments, setPayments, isAdmin,
  saving, handleSale, setIsCartOpen,
  invoices,
  // suspended features
  suspendedCarts, handleSuspendCart, handleResumeCart, handleDeleteSuspended,
}) => {
  const [focusedField, setFocusedField] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('cart')
  const [showCarSuggestions, setShowCarSuggestions] = useState(false)
  const [showSuspendedModal, setShowSuspendedModal] = useState(false)

  const totalPaid = Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)
  const discount = Number(payments.discount || 0)
  const finalTotal = cartTotal - discount
  const remaining = finalTotal - totalPaid

  /* Customer debt from invoices */
  const customerDebt = useMemo(() => {
    if (!customer.name && !customer.phone) return 0
    return invoices.filter(inv => {
      const matchPhone = customer.phone && inv.customerData?.phone === customer.phone
      const matchName = !customer.phone && customer.name && inv.customerData?.name?.toLowerCase() === customer.name?.toLowerCase()
      return (matchPhone || matchName) && inv.paymentStatus !== 'paid'
    }).reduce((sum, inv) => sum + (inv.dueAmount || 0), 0)
  }, [invoices, customer.name, customer.phone])

  const matchedCustomerHistory = useMemo(() => {
    if (!customer.name && !customer.phone) return []
    return invoices.filter(inv => 
      (customer.phone && inv.customerData?.phone === customer.phone) ||
      (!customer.phone && customer.name && inv.customerData?.name?.toLowerCase() === customer.name?.toLowerCase())
    ).sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
      const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
      return db - da
    })
  }, [invoices, customer.name, customer.phone])

  /* Auto-fill remaining for payment method */
  const fillRemaining = (method) => {
    const otherPaid = totalPaid - Number(payments[method] || 0)
    const leftover = finalTotal - otherPaid
    if (leftover > 0) {
      setPayments(p => ({ ...p, [method]: String(leftover) }))
    }
  }

  /* Payment progress percentage */
  const paymentProgress = finalTotal > 0 ? Math.min((totalPaid / finalTotal) * 100, 100) : 0

  /* Car autocomplete filtering */
  const filteredCarSuggestions = useMemo(() => {
    const q = (customer.carModel || '').trim().toLowerCase()
    if (!q) return POPULAR_CARS.slice(0, 8)
    return POPULAR_CARS.filter(c => c.toLowerCase().includes(q)).slice(0, 8)
  }, [customer.carModel])

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Cart Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200/60 flex items-center justify-between bg-white shrink-0">
        <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
            <ShoppingCart size={18} className="text-primary-600" />
          </div>
          سلة البيع
          {cart.length > 0 && (
            <span className="bg-primary-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
              {cart.reduce((s, i) => s + i.qty, 0)} صنف
            </span>
          )}
        </h2>
        <div className="flex gap-2 items-center">
          {/* Suspended Carts Trigger */}
          {suspendedCarts.length > 0 && (
            <button 
              type="button"
              onClick={() => setShowSuspendedModal(true)}
              className="text-[10px] font-black text-primary-600 hover:text-primary-800 transition-colors px-2 py-1.5 rounded-xl bg-primary-50 border border-primary-100 flex items-center gap-1.5"
              title="العمليات المعلقة"
            >
              <FolderSync size={13} className="animate-pulse" />
              المعلقة ({suspendedCarts.length})
            </button>
          )}

          {/* Suspend Action */}
          {cart.length > 0 && (
            <button 
              type="button"
              onClick={handleSuspendCart}
              className="text-[10px] font-black text-amber-600 hover:text-amber-800 transition-colors px-2 py-1.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-1"
              title="تعليق السلة الحالية لحين عودة العميل"
            >
              📥 تعليق
            </button>
          )}

          {cart.length > 0 && (
            <button onClick={cartClear} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50">
              مسح الكل
            </button>
          )}
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/60 bg-white p-2 gap-2 shrink-0">
        <button type="button" onClick={() => setActiveTab('cart')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cart' 
              ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}>
          <ShoppingCart size={14} /> السلة ({cart.length})
        </button>
        <button type="button" onClick={() => setActiveTab('checkout')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'checkout' 
              ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}>
          <Users size={14} /> الدفع والعميل
          {customer.name && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-hide space-y-3">
        {activeTab === 'cart' ? (
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 border border-slate-200">
                  <ShoppingCart size={36} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">السلة فارغة</p>
                <p className="text-slate-300 text-[10px] mt-2">اضغط على المنتجات لإضافتها</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div layout
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  drag="x" dragConstraints={{ left: -100, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -80) {
                       cartRemove(item.id)
                       if (window.navigator?.vibrate) window.navigator.vibrate(10)
                    }
                  }}
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/60 hover:border-primary-200 shadow-sm transition-all group touch-pan-y">
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-black truncate font-display">{item.name}</p>
                      <p className="text-sm text-emerald-600 font-black mt-1 tracking-wide font-display">
                        {Number(item.price).toLocaleString('en-US')} ج.م
                      </p>
                      {isAdmin && (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 inline-block mt-1">
                          الربح: {((item.price - (item.cost || 0)) * item.qty).toLocaleString()} ج
                        </span>
                      )}
                      {item.weight > 0 && (
                        <div className="mt-1.5 flex items-center gap-2 pointer-events-auto">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            ⚖️ {item.weight} كجم
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shrink-0 pointer-events-auto">
                      <button onClick={() => cartQty(item.id, item.qty - 1)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors bg-white border border-slate-200 shadow-sm active:scale-90">
                        <Minus size={14} className="text-slate-600" />
                      </button>
                      <span className="text-slate-900 text-sm font-black w-6 text-center">{item.qty}</span>
                      <button onClick={() => cartQty(item.id, item.qty + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors bg-white border border-slate-200 shadow-sm active:scale-90">
                        <Plus size={14} className="text-slate-600" />
                      </button>
                    </div>
                    <button onClick={() => cartRemove(item.id)} className="w-9 h-9 text-rose-400 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all pointer-events-auto hidden sm:flex">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        ) : (
          <div className="space-y-4">
            {/* Customer debt alert */}
            {customerDebt > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800">تنبيه: العميل عليه مديونية سابقة</p>
                  <p className="text-lg font-black text-amber-700">{customerDebt.toLocaleString()} ج.م</p>
                </div>
              </motion.div>
            )}

            {/* Auto-save badge */}
            {customer.name && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  سيتم إضافة العميل تلقائياً في صفحة العملاء
                </p>
              </div>
            )}

            {/* Customer Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">اسم العميل بالكامل *</label>
                <div className="relative group">
                  <input id="customer-name-input" value={customer.name}
                    onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    placeholder="مثلاً: محمد علي" className="input !py-3.5 pr-11 text-sm" autoComplete="off" />
                  <Users size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  {focusedField === 'name' && suggestedCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {suggestedCustomers.map(sc => (
                        <button key={sc.id} type="button"
                          onMouseDown={() => {
                            setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })
                            setFocusedField(null)
                          }}
                          className="w-full text-right px-4 py-3 hover:bg-primary-50 transition-all flex justify-between items-center group/item">
                          <div className="flex items-center gap-2">
                            <ChevronLeft size={14} className="text-slate-300 group-hover/item:text-primary-600 group-hover/item:-translate-x-1 transition-all shrink-0" />
                            {sc.phone && <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded text-[10px] font-black">{sc.phone}</span>}
                            {sc.carModel && <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold max-w-[120px] truncate">🚗 {sc.carModel}</span>}
                          </div>
                          <span className="text-slate-900 text-sm font-bold font-display">{sc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">رقم الهاتف / الواتساب</label>
                <div className="relative group">
                  <input id="customer-phone-input" value={customer.phone}
                    onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                    placeholder="01xxxxxxxxx" className="input !py-3.5 text-sm font-bold" autoComplete="off" />
                  {focusedField === 'phone' && suggestedCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {suggestedCustomers.map(sc => (
                        <button key={sc.id} type="button"
                          onMouseDown={() => {
                            setCustomer({ name: sc.name, phone: sc.phone || '', carModel: sc.carModel || '', licensePlate: sc.licensePlate || '', nationalId: sc.nationalId || '' })
                            setFocusedField(null)
                          }}
                          className="w-full text-right px-4 py-3 hover:bg-primary-50 transition-all flex justify-between items-center group/item">
                          <div className="flex items-center gap-2">
                            <ChevronLeft size={14} className="text-slate-300 group-hover/item:text-primary-600 group-hover/item:-translate-x-1 transition-all shrink-0" />
                            {sc.phone && <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded text-[10px] font-black">{sc.phone}</span>}
                          </div>
                          <span className="text-slate-900 text-sm font-bold font-display">{sc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">الرقم القومي</label>
                  <input id="customer-national-id-input" value={customer.nationalId}
                    onChange={e => setCustomer(p => ({ ...p, nationalId: e.target.value }))}
                    placeholder="29xxx..." className="input !py-3.5 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">رقم اللوحة</label>
                  <input id="customer-license-input" value={customer.licensePlate}
                    onChange={e => setCustomer(p => ({ ...p, licensePlate: e.target.value }))}
                    placeholder="أ ب ج 123" className="input !py-3.5 text-sm font-bold" />
                </div>
              </div>

              <div>
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">نوع السيارة والموديل</label>
                <div className="relative">
                  <input id="customer-car-input" value={customer.carModel}
                    onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))}
                    onFocus={() => setShowCarSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCarSuggestions(false), 200)}
                    placeholder="لانسر بومة 2008" className="input !py-3.5 text-sm font-bold" autoComplete="off" />
                  
                  {/* Car model suggestions popup above input */}
                  {showCarSuggestions && filteredCarSuggestions.length > 0 && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto text-right">
                      {filteredCarSuggestions.map((car, idx) => (
                        <button 
                          key={idx} 
                          type="button"
                          onMouseDown={() => {
                            setCustomer(p => ({ ...p, carModel: car }))
                            setShowCarSuggestions(false)
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-primary-50 transition-all text-xs font-bold text-slate-700 flex items-center justify-between"
                        >
                          <span>🚗</span>
                          <span>{car}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer History Button */}
            {matchedCustomerHistory.length > 0 && (
              <button type="button" onClick={() => setShowHistory(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 border border-primary-100 hover:bg-primary-100 hover:border-primary-200 rounded-2xl transition-all">
                <div className="flex items-center gap-2.5">
                  <Wrench size={14} className="text-primary-600" />
                  <span className="text-xs font-black text-primary-800">
                    سجل صيانة العميل ({matchedCustomerHistory.length} زيارات)
                  </span>
                </div>
                <ChevronLeft size={14} className="text-primary-600" />
              </button>
            )}

            {/* Customer History Modal */}
            <AnimatePresence>
              {showHistory && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowHistory(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed bottom-0 inset-x-0 h-[85vh] md:h-[75vh] bg-white rounded-t-[2.5rem] z-[110] overflow-hidden shadow-2xl flex flex-col border-t border-slate-200">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" onClick={() => setShowHistory(false)} />
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div className="text-right">
                        <h3 className="text-lg font-black text-slate-950 font-display flex items-center gap-2">
                          <Wrench size={18} className="text-primary-600" /> سجل العميل
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          أ/ {customer.name} {customer.carModel ? `| ${customer.carModel}` : ''}
                        </p>
                      </div>
                      <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-950 bg-slate-100 rounded-xl transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                      {matchedCustomerHistory.map((inv) => (
                        <div key={inv.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-3 text-right">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              ⏱️ {(inv.createdAt?.toDate?.() || new Date(inv.createdAt)).toLocaleDateString('en-GB')}
                            </span>
                            <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                              فاتورة #{inv.number}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {inv.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <span className="text-slate-500">{item.qty} × {Number(item.price).toLocaleString()} ج.م</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-xs font-black">
                            <span className="text-slate-500">الإجمالي: {inv.total?.toLocaleString()} ج.م</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {inv.paymentStatus === 'paid' ? 'مدفوع' : `متبقي: ${inv.dueAmount?.toLocaleString()} ج`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-slate-50">
                      <button onClick={() => setShowHistory(false)} className="btn-ghost w-full !py-3 text-xs font-black uppercase tracking-wider">إغلاق</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ─── PAYMENT CARDS ─── */}
            <div className="pt-3 border-t border-slate-200 mt-4">
              <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-3 px-1 text-center">طريقة الدفع</p>
              
              {/* Interactive Payment Cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'cash', label: 'كاش', icon: Wallet, color: 'emerald', bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-600' },
                  { key: 'visa', label: 'فيزا', icon: CreditCard, color: 'blue', bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-600' },
                  { key: 'instapay', label: 'إنستاباي', icon: Landmark, color: 'purple', bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-200', text: 'text-purple-700', iconColor: 'text-purple-600' },
                ].map(pm => {
                  const Icon = pm.icon
                  const hasValue = Number(payments[pm.key] || 0) > 0
                  return (
                    <div key={pm.key} className="space-y-1.5">
                      {/* Quick-fill button */}
                      <button type="button" onClick={() => fillRemaining(pm.key)}
                        className={`w-full rounded-xl border ${hasValue ? pm.border + ' bg-gradient-to-b ' + pm.bg : 'border-slate-200 bg-white hover:border-slate-300'} p-3 transition-all flex flex-col items-center gap-1.5 group/pm active:scale-95`}>
                        <Icon size={18} className={hasValue ? pm.iconColor : 'text-slate-400 group-hover/pm:text-slate-600'} />
                        <span className={`text-[10px] font-black ${hasValue ? pm.text : 'text-slate-400'}`}>{pm.label}</span>
                      </button>
                      {/* Amount input */}
                      <input type="number" value={payments[pm.key]}
                        onChange={e => setPayments(p => ({ ...p, [pm.key]: e.target.value }))}
                        placeholder="0"
                        className={`input !py-2.5 text-center text-sm font-black !rounded-xl ${hasValue ? `!bg-${pm.color}-50/50 !border-${pm.color}-200` : ''}`} />
                    </div>
                  )
                })}
              </div>

              {/* Payment Progress Bar */}
              {finalTotal > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">المدفوع</span>
                    <span className={totalPaid >= finalTotal ? 'text-emerald-600' : 'text-amber-600'}>
                      {totalPaid.toLocaleString()} / {finalTotal.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${paymentProgress}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className={`h-full rounded-full ${
                        paymentProgress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                        paymentProgress >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        'bg-gradient-to-r from-rose-400 to-rose-500'
                      }`}
                    />
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between items-center px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-black uppercase">مديونية</span>
                      <span className="text-sm font-black text-rose-600">{remaining.toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Total + CTA */}
      <div className="p-4 sm:p-6 border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe shrink-0">
        <div className="space-y-2 mb-4 px-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">إجمالي السلة</span>
            <span className="text-sm font-bold text-slate-400 line-through decoration-rose-300 decoration-2">
              {cartTotal.toLocaleString()} ج.م
            </span>
          </div>
          <div className="flex justify-between items-center bg-gradient-to-r from-primary-50 to-primary-100/50 p-3.5 rounded-2xl border border-primary-100">
            <div className="flex flex-col">
              <span className="text-primary-800 text-[10px] font-black uppercase tracking-widest">المبلغ النهائي</span>
              <input type="number" value={payments.discount || ''} 
                onChange={e => setPayments(p => ({ ...p, discount: e.target.value }))}
                placeholder="خصم..." 
                className="bg-transparent border-none p-0 text-rose-500 text-[10px] font-black focus:ring-0 w-20 outline-none" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-primary-900 font-display tracking-tighter">
              {finalTotal.toLocaleString('en-US')} <span className="text-xs font-normal">ج.م</span>
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {activeTab === 'cart' ? (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('checkout')} disabled={cart.length === 0}
              className="w-full btn-primary !py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider disabled:opacity-20">
              متابعة إدخال البيانات ←
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setActiveTab('cart')}
                className="btn-ghost !py-3.5 text-xs font-black uppercase tracking-wider px-3 flex items-center gap-1.5">
                ← السلة
              </button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleSale} disabled={cart.length === 0 || !customer.name || saving}
                className="btn-primary !py-3.5 flex-1 text-sm font-black uppercase tracking-[0.1em] shadow-neon disabled:opacity-20 active:scale-95">
                <Send size={16} /> {saving ? 'جار الحفظ...' : 'إتمام البيع'}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Suspended Carts Modal Overlay */}
      <AnimatePresence>
        {showSuspendedModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowSuspendedModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] sm:h-[500px] bg-white border border-slate-200 rounded-[2rem] z-[210] shadow-2xl flex flex-col overflow-hidden text-right"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <FolderSync size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 font-display">العمليات والطلبات المعلقة</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">تأجيل الدفع وتجهيز السلة لاحقاً</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSuspendedModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {suspendedCarts.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                        <Clock size={13} />
                        <span>{new Date(item.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <span className="text-[10px] font-black text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                        {item.cart?.length || 0} أصناف
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-black text-slate-800">{item.customer?.name || 'عميل نقدي سريع'}</p>
                        {item.customer?.carModel && <p className="text-[10px] text-slate-400 mt-0.5 font-bold">🚗 {item.customer.carModel}</p>}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-slate-800 text-sm">{(item.cartTotal || 0).toLocaleString()} ج.م</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => {
                          handleResumeCart(item)
                          setShowSuspendedModal(false)
                        }}
                        className="flex-1 btn-primary !py-2 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-xl flex items-center justify-center gap-1.5"
                      >
                        📤 استرجاع السلة
                      </button>
                      <button 
                        onClick={() => handleDeleteSuspended(item.id)}
                        className="p-2 border border-rose-200 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        title="حذف العملية"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex">
                <button 
                  onClick={() => setShowSuspendedModal(false)}
                  className="w-full btn-ghost !py-3 text-xs font-black uppercase tracking-wider !rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})
CartContent.displayName = 'CartContent'


/* ═══════════════════════════════════════════════════════════════
   MAIN POS COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function POS() {
  const {
    products, cart, cartAdd, cartRemove, cartQty, cartClear, cartTotal,
    completeSale, customers, invoices
  } = useStore()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const [search, setSearch] = useState('')
  const [catFilter, setCat] = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '' })
  const [saving, setSaving] = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [reminders, setReminders] = useState({})
  const [itemWeights, setItemWeightsState] = useState({})
  const [unitSelectProduct, setUnitSelectProduct] = useState(null) // for box/piece selection

  // Suspended Carts state
  const [suspendedCarts, setSuspendedCarts] = useState(() => {
    const raw = window.localStorage.getItem('suspendedCarts')
    return raw ? JSON.parse(raw) : []
  })

  // Visual Search State
  const [showVisionScanner, setShowVisionScanner] = useState(false)
  const [isVisionScanning, setIsVisionScanning] = useState(false)
  // Gemini API key: يفضّل env variable، والمستخدم يمكنه تجاوزه مؤقتاً
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => import.meta.env.VITE_GEMINI_API_KEY || window.localStorage.getItem('geminiApiKey') || ''
  )
  const videoRef = useRef(null)

  const startVisionCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الكاميرا في الروابط غير المشفرة (HTTP). يرجى فتح الموقع عبر رابط HTTPS آمن أو localhost.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      toast.error('تعذر تشغيل الكاميرا: ' + err.message, { duration: 6000 })
    }
  }

  const stopVisionCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    if (showVisionScanner) {
      startVisionCamera()
    } else {
      stopVisionCamera()
    }
    return () => stopVisionCamera()
  }, [showVisionScanner])

  const handleVisionRecognize = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      toast.error('الكاميرا غير جاهزة بعد!')
      return
    }
    if (!geminiApiKey) {
      toast.error('مفتاح Gemini API غير مدخل!')
      return
    }
    setIsVisionScanning(true)
    const t = toast.loading('جاري إرسال الصورة للتعرف البصري عبر Gemini...', { id: 'gemini-vision' })
    try {
      const canvas = document.createElement('canvas')
      const MAX_DIM = 400
      let w = video.videoWidth
      let h = video.videoHeight
      if (w > h) {
        if (w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM }
      } else {
        if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM }
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, w, h)
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.6)
      const base64Data = base64Image.split(',')[1]

      const productList = products.map(p => `- ${p.name}`).join('\n')
      const promptText = `Analyze this image and match it to exactly one product from this list. Respond with ONLY the exact product name, nothing else. If none match, respond with 'NONE'.\nList of products:\n${productList}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: 'image/jpeg', data: base64Data } }] }]
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`فشل الاتصال بـ Gemini API (${response.status}): ${errText.slice(0, 200)}`)
      }

      const resData = await response.json()
      const matchedName = String(resData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()

      const matchedProduct = products.find(p =>
        p.name.trim().toLowerCase() === matchedName.toLowerCase() ||
        matchedName.toLowerCase().includes(p.name.trim().toLowerCase())
      )
      if (matchedProduct) {
        handleCartAdd(matchedProduct)
        toast.success(`✨ تم التعرف وإضافة: ${matchedProduct.name}`, { id: 'gemini-vision' })
        setShowVisionScanner(false)
      } else {
        toast.error(`لم يتم التعرف على منتج مطابق. رد النموذج: ${matchedName}`, { id: 'gemini-vision' })
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء الاتصال بـ Gemini!', { id: 'gemini-vision', duration: 6000 })
    } finally {
      setIsVisionScanning(false)
    }
  }




  const setItemWeight = useCallback((itemId, kg) => {
    setItemWeightsState(prev => ({ ...prev, [itemId]: kg }))
  }, [])

  useEffect(() => {
    window.localStorage.setItem('suspendedCarts', JSON.stringify(suspendedCarts))
  }, [suspendedCarts])

  useEffect(() => {
    const raw = window.localStorage.getItem('pendingQuoteCustomer')
    if (!raw) return
    try {
      const pendingCustomer = JSON.parse(raw)
      if (pendingCustomer && typeof pendingCustomer === 'object') {
        setCustomer({
          name: String(pendingCustomer.name || ''),
          phone: String(pendingCustomer.phone || ''),
          carModel: String(pendingCustomer.carModel || ''),
          licensePlate: String(pendingCustomer.licensePlate || ''),
          nationalId: String(pendingCustomer.nationalId || ''),
        })
      }
    } catch (error) {
      console.error('Pending quote customer parse error', error)
    } finally {
      window.localStorage.removeItem('pendingQuoteCustomer')
    }
  }, [])

  /* ─── Categories list ─── */
  const categoriesList = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))]
  }, [products])

  /* ─── Filtered products ─── */
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

  /* ─── Map of product IDs in the cart for fast lookup ─── */
  const cartMap = useMemo(() => {
    const map = {}
    cart.forEach(item => { map[item.id] = item.qty })
    return map
  }, [cart])

  /* ─── Customer suggestions ─── */
  const suggestedCustomers = useMemo(() => {
    const nameQuery = (customer.name || '').trim().toLowerCase()
    const phoneQuery = (customer.phone || '').trim()
    if (nameQuery.length < 2 && phoneQuery.length < 2) return []
    return customers.filter(c => {
      const matchName = nameQuery.length >= 2 && c.name?.toLowerCase().includes(nameQuery)
      const matchPhone = phoneQuery.length >= 2 && c.phone?.includes(phoneQuery)
      return matchName || matchPhone
    }).slice(0, 5)
  }, [customers, customer.name, customer.phone])

  /* ─── Handle sale ─── */
  const handleSale = useCallback(async () => {
    if (cart.length === 0 || !customer.name) return
    setSaving(true)
    try {
      const totalPaid = Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0)
      const discount = Number(payments.discount || 0)

      // ✅ Fix: Validate discount bounds
      if (discount < 0) {
        toast.error('الخصم لا يمكن أن يكون بقيمة سالبة')
        setSaving(false)
        return
      }
      if (discount > cartTotal) {
        toast.error('الخصم أكبر من إجمالي الفاتورة!')
        setSaving(false)
        return
      }

      const finalTotal = Math.max(0, cartTotal - discount)
      const dueAmount = finalTotal - totalPaid

      const { id: invId, number: invNum } = await completeSale({
        customerData: customer,
        items: cart.map(i => ({ ...i, reminderMonths: reminders[i.id] || 0 })),
        total: finalTotal,
        paidAmount: totalPaid,
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        payments: {
          cash: Number(payments.cash || 0),
          visa: Number(payments.visa || 0),
          instapay: Number(payments.instapay || 0)
        }
      })

      setDoneInvoice({
        id: invId,
        number: invNum,
        total: finalTotal,
        due: dueAmount > 0 ? dueAmount : 0,
        customerPhone: customer.phone,
        customerName: customer.name,
        customerCar: customer.carModel,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      })

      // ── إرسال الفاتورة تلقائياً عبر واتساب إذا كان للعميل رقم هاتف ──
      if (customer.phone) {
        toast.loading('جاري إرسال الفاتورة على واتساب...', { id: 'wa-send' })
        try {
          // ✅ Get Firebase Auth token for API authentication
          const { getAuth } = await import('firebase/auth')
          const fbUser = getAuth().currentUser
          const idToken = fbUser ? await fbUser.getIdToken() : null

          const waRes = await fetch('/api/send-invoice-whatsapp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
            },
            body: JSON.stringify({ id: invId }),
          })
          if (waRes.ok) {
            toast.success('✅ تم إرسال الفاتورة للعميل على واتساب!', { id: 'wa-send', duration: 4000 })
          } else {
            const err = await waRes.json().catch(() => ({}))
            toast.error(`⚠️ لم يُرسل الواتساب: ${err?.error || 'خطأ غير معروف'}`, { id: 'wa-send', duration: 5000 })
          }
        } catch {
          toast.error('⚠️ تعذّر الاتصال بخدمة الواتساب', { id: 'wa-send', duration: 5000 })
        }
      }

      setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
      setPayments({ cash: '', visa: '', instapay: '' })
      setReminders({})
    } catch (e) {
      toast.error(e?.message || 'حدث خطأ أثناء حفظ الفاتورة!')
    } finally {
      setSaving(false)
    }
  }, [cart, cartTotal, completeSale, customer, payments, reminders])

  /* ─── Barcode / scanner ─── */
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScannerError(null)
    const html5QrCode = new Html5Qrcode('reader')
    html5QrCode.scanFile(file, true)
      .then(decodedText => { setSearch(decodedText); setShowScanner(false); setScannerError(null) })
      .catch(() => setScannerError('فشل قراءة الملف. تأكد من وضوح الباركود.'))
  }

  useEffect(() => {
    let qrScanner = null
    if (showScanner) {
      qrScanner = new Html5Qrcode('reader')
      qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          setSearch(decodedText)
          setShowScanner(false)
          toast.success(`تم العثور على باركود: ${decodedText}`)
        },
        (errorMessage) => {
          // ignore standard scanning noise errors
        }
      ).catch(err => {
        console.error('Html5Qrcode start error:', err)
        setScannerError('تعذر تشغيل الكاميرا: ' + err.message)
      })
    }
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(err => console.error('Html5Qrcode stop error:', err))
      }
    }
  }, [showScanner])

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
    if (p.hasSubUnits) {
      // Show unit selection popup
      setUnitSelectProduct(p)
      return
    }
    cartAdd(p)
    if (window.navigator?.vibrate) window.navigator.vibrate(15)
  }

  const handleCartAddWithUnit = (p, unit) => {
    // unit: 'piece' or 'box'
    const piecesPerBox = Number(p.piecesPerBox || 1)
    if (unit === 'piece') {
      const pieceItem = {
        ...p,
        id: p.id + '_piece',
        name: p.name + ' (قطعة)',
        price: Number(p.piecePrice || p.price),
        _originalId: p.id,
        _unit: 'piece',
        _piecesPerBox: 1,
      }
      cartAdd(pieceItem)
    } else {
      const boxItem = {
        ...p,
        id: p.id + '_box',
        name: p.name + ' (علبة - ' + piecesPerBox + ' قطعة)',
        price: Number(p.price),
        _originalId: p.id,
        _unit: 'box',
        _piecesPerBox: piecesPerBox,
      }
      cartAdd(boxItem)
    }
    setUnitSelectProduct(null)
    if (window.navigator?.vibrate) window.navigator.vibrate(15)
  }

  /* ─── Suspend / Resume Actions ─── */
  const handleSuspendCart = useCallback(() => {
    if (cart.length === 0) return toast.error('السلة فارغة حالياً!')
    const newSuspended = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      customer: { ...customer },
      cart: [...cart],
      payments: { ...payments },
      reminders: { ...reminders },
      itemWeights: { ...itemWeights },
      cartTotal
    }
    setSuspendedCarts(prev => [newSuspended, ...prev])
    cartClear()
    setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
    setPayments({ cash: '', visa: '', instapay: '' })
    setReminders({})
    toast.success('تم تعليق السلة وحفظها بنجاح 📥')
  }, [cart, customer, payments, reminders, itemWeights, cartTotal, cartClear])

  const handleResumeCart = useCallback((suspended) => {
    cartClear()
    suspended.cart.forEach(item => {
      const productObj = {
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost || 0,
        category: item.category || 'عام',
        quantity: item.quantity || 999
      }
      cartAdd(productObj)
      cartQty(item.id, item.qty)
    })
    setCustomer(suspended.customer || { name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
    setPayments(suspended.payments || { cash: '', visa: '', instapay: '' })
    setReminders(suspended.reminders || {})
    if (suspended.itemWeights) {
      Object.entries(suspended.itemWeights).forEach(([id, weight]) => {
        setItemWeight(id, weight)
      })
    }
    setSuspendedCarts(prev => prev.filter(c => c.id !== suspended.id))
    toast.success('تم استعادة السلة المعلقة بنجاح 📤')
  }, [cartClear, cartAdd, cartQty, setItemWeight])

  const handleDeleteSuspended = useCallback((id) => {
    setSuspendedCarts(prev => prev.filter(c => c.id !== id))
    toast.success('تم حذف العملية المعلقة')
  }, [])



  /* ─── Cart props memo ─── */
  const cartProps = useMemo(() => ({
    cart, cartTotal, cartClear, cartQty, cartRemove,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments, isAdmin,
    saving, handleSale, setIsCartOpen,
    invoices,
    // suspended features
    suspendedCarts, handleSuspendCart, handleResumeCart, handleDeleteSuspended
  }), [
    cart, cartTotal, cartClear, cartQty, cartRemove,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments, isAdmin,
    saving, handleSale, setIsCartOpen,
    invoices,
    suspendedCarts, handleSuspendCart, handleResumeCart, handleDeleteSuspended
  ])


  /* ═══ MAIN POS LAYOUT ═══ */
  return (
    <div className="flex min-h-full flex-col overflow-hidden bg-[#f1f5f9] font-display xl:h-full xl:flex-row" dir="rtl">

      {/* ===== Unit Selection Modal (Box / Piece) ===== */}
      <AnimatePresence>
        {unitSelectProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
            onClick={() => setUnitSelectProduct(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="text-lg font-black text-slate-800 text-center mb-1">{unitSelectProduct.name}</h3>
              <p className="text-xs text-slate-500 text-center mb-6">اختر وحدة البيع</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCartAddWithUnit(unitSelectProduct, 'piece')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <span className="text-3xl">🔩</span>
                  <span className="font-black text-blue-700 text-sm">قطعة</span>
                  <span className="text-xs font-bold text-blue-500">{Number(unitSelectProduct.piecePrice || unitSelectProduct.price).toLocaleString()} ج.م</span>
                </button>
                <button
                  onClick={() => handleCartAddWithUnit(unitSelectProduct, 'box')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  <span className="text-3xl">📦</span>
                  <span className="font-black text-amber-700 text-sm">علبة ({unitSelectProduct.piecesPerBox} قطعة)</span>
                  <span className="text-xs font-bold text-amber-500">{Number(unitSelectProduct.price).toLocaleString()} ج.م</span>
                </button>
              </div>
              <button
                onClick={() => setUnitSelectProduct(null)}
                className="mt-4 w-full text-xs text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
              >إلغاء</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Grid Area */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="custom-scrollbar flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 xl:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight font-display">نقطة البيع</h1>
                <span className="bg-primary-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-primary-600 rounded-md border border-primary-100 w-fit">PRO</span>
              </div>
            </div>
            <button onClick={() => window.location.reload(true)} 
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black shadow-sm active:bg-slate-50 transition-all sm:hidden">
              تحديث 🔄
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="relative flex-1">
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن أصناف..."
                className="h-11 w-full rounded-xl bg-slate-50 pr-10 pl-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 sm:h-12" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => setShowVisionScanner(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all active:scale-95"
                title="التعرف البصري بالذكاء الاصطناعي"
              >
                <Sparkles size={18} className="animate-pulse" />
              </button>
              {showScanner ? (
                <button onClick={() => setShowScanner(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-all active:scale-95">
                  <X size={18} />
                </button>
              ) : (
                <button onClick={() => setShowScanner(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-all active:scale-95">
                  <Camera size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ── CATEGORY FILTER BAR ── */}
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
            <button onClick={() => setCat('')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                !catFilter 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:text-primary-600'
              }`}>
              <Package size={14} /> الكل
              <span className="text-[10px] opacity-70">({products.filter(p => p.quantity > 0).length})</span>
            </button>
            {categoriesList.map(c => {
              const count = products.filter(p => p.category === c && p.quantity > 0).length
              return (
                <button key={c} onClick={() => setCat(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    catFilter === c 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:text-primary-600'
                  }`}>
                  <span>{getCatIcon(c)}</span> {c}
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {scannerError && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 mb-4">{scannerError}</p>
        )}

        {/* Scanner UI */}
        <AnimatePresence>
          {showScanner && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="overflow-hidden bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 relative mb-4">
              <div id="reader" className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-black min-h-[250px] shadow-2xl" />
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

        {/* Ollama AI Vision Scanner UI */}
        <AnimatePresence>
          {showVisionScanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overflow-hidden bg-slate-900 border border-slate-700/50 p-5 relative mb-4 rounded-3xl shadow-xl flex flex-col gap-4 text-right"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles size={16} className="animate-pulse" />
                  <span className="text-xs font-black">التعرف البصري الذكي للقطع (بالذكاء الاصطناعي)</span>
                </div>
                <button
                  onClick={() => setShowVisionScanner(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Video Stream Preview */}
              <div className="relative aspect-video w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isVisionScanning && (
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">جاري التحليل والمطابقة...</p>
                  </div>
                )}
              </div>

              {/* Settings and Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 font-display">
                  <label className="text-[10px] text-slate-400 font-bold mb-1 block">مفتاح Gemini API</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value)
                      window.localStorage.setItem('geminiApiKey', e.target.value)
                    }}
                    placeholder="مفتاح API الخاص بك"
                    className="input !py-2.5 !bg-slate-950 !border-slate-800 !text-slate-100 !rounded-xl text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <button
                  type="button"
                  disabled={isVisionScanning}
                  onClick={handleVisionRecognize}
                  className="btn-primary !bg-purple-600 hover:!bg-purple-500 !py-3 w-full text-xs font-black"
                >
                  {isVisionScanning ? 'جاري التحليل والمطابقة...' : 'التقاط وتحليل الصورة 📸'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* PRODUCTS GRID */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(p => {
            const inCart = cartMap[p.id] || 0
            const isLowStock = p.quantity <= 5
            return (
              <motion.div variants={itemVariant} key={p.id}
                className={`group relative overflow-hidden rounded-2xl border bg-white text-right transition-all hover:shadow-lg ${
                  inCart > 0 
                    ? 'border-primary-300 ring-2 ring-primary-100 shadow-md' 
                    : isLowStock 
                      ? 'border-amber-200' 
                      : 'border-slate-200 hover:border-primary-200'
                }`}>
                
                <AnimatePresence>
                  {inCart > 0 && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-2 left-2 z-10 bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-primary-500/40 border-2 border-white">
                      {inCart}
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLowStock && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5">
                      <AlertTriangle size={10} /> {p.quantity}
                    </span>
                  </div>
                )}

                <button onClick={() => handleCartAdd(p)} className="w-full text-right p-3.5 sm:p-4 focus:outline-none active:scale-[0.97] transition-transform">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{getCatIcon(p.category)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-black leading-snug text-slate-950 truncate pr-0">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[9px] font-black text-white">{p.category || 'عام'}</span>
                        {!isLowStock && (
                          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-black text-emerald-600">
                            متاح {p.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">السعر</p>
                      <p className="text-xl sm:text-2xl font-black tracking-tight text-primary-600 leading-none mt-0.5">
                        {Number(p.price).toLocaleString('en-US')}
                        <span className="mr-1 text-[10px] font-bold text-slate-400">ج.م</span>
                      </p>
                    </div>
                    {inCart === 0 && (
                      <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                        <Plus size={20} />
                      </div>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {inCart > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-primary-100 bg-primary-50/50">
                      <div className="flex items-center justify-between px-3.5 py-2">
                        <button onClick={(e) => { e.stopPropagation(); cartQty(p.id, inCart - 1) }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform hover:bg-rose-50 hover:border-rose-200">
                          {inCart === 1 ? <Trash2 size={14} className="text-rose-500" /> : <Minus size={14} className="text-slate-600" />}
                        </button>
                        <span className="text-sm font-black text-primary-700">{inCart} في السلة</span>
                        <button onClick={(e) => { e.stopPropagation(); cartQty(p.id, inCart + 1) }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform hover:bg-primary-50 hover:border-primary-200">
                          <Plus size={14} className="text-primary-600" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">لم يتم العثور على نتائج</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Desktop Side Cart */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[400px] 2xl:w-[430px] shrink-0 hidden xl:block border-r border-slate-200 h-full">
        <div className="flex flex-col h-full bg-white shadow-xl">
          <CartContent {...cartProps} />
        </div>
      </motion.div>

      {/* Floating Mobile Cart Bar */}
      <AnimatePresence>
        {!isCartOpen && cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-3 z-[45] flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-[0_15px_40px_rgba(15,23,42,0.15)] transition-all active:scale-[0.98] xl:hidden"
            style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            onClick={() => setIsCartOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <ShoppingCart size={20} className="text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-black w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-0.5">إجمالي</p>
                <p className="text-lg font-black text-slate-950 font-display leading-none tracking-tight">
                  {cartTotal.toLocaleString('en-US')} <span className="text-[10px] font-normal opacity-50">ج.م</span>
                </p>
              </div>
            </div>
            <div className="bg-primary-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider shadow-md shadow-primary-500/20">
              عرض السلة <Receipt size={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Cart */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] xl:hidden" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 inset-x-0 h-[92vh] bg-white rounded-t-[2.5rem] z-[110] xl:hidden overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.2)] border-t border-slate-200">
              <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 active:bg-slate-300 transition-all" onClick={() => setIsCartOpen(false)} />
              <CartContent {...cartProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal with WhatsApp option */}
      <AnimatePresence>
        {doneInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDoneInvoice(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 z-[410] shadow-2xl text-center flex flex-col items-center justify-center gap-5"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center text-3xl">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">تمت عملية البيع بنجاح!</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">فاتورة مبيعات رقم #{doneInvoice.number}</p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 text-right space-y-2">
                <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">العميل:</span><span className="text-slate-800 dark:text-slate-100">{doneInvoice.customerName || 'نقدي'}</span></div>
                <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">الإجمالي:</span><span className="text-slate-900 dark:text-white font-black">{doneInvoice.total?.toLocaleString()} ج.م</span></div>
                {doneInvoice.customerPhone && <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">الهاتف:</span><span className="text-slate-800 dark:text-slate-100">{doneInvoice.customerPhone}</span></div>}
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={() => {
                    let phone = doneInvoice.customerPhone
                    if (!phone) {
                      phone = window.prompt('يرجى إدخال رقم هاتف العميل لإرسال الفاتورة عبر واتساب (مثال: 01115329887):')
                      if (!phone) return
                    }
                    const cleanPhone = phone.replace(/^0/, '20').replace(/\D/g, '')
                    const msg = `🧾 فاتورة مبيعات من ELFAROUK Service\nرقم الفاتورة: #${doneInvoice.number}\nالعميل: ${doneInvoice.customerName || 'نقدي'}\nالإجمالي: ${doneInvoice.total} ج.م\nشكراً لتعاملكم معنا 🙏`
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                  }}
                  className="w-full btn-primary !bg-emerald-600 hover:!bg-emerald-500 !py-3 text-xs font-black flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} /> إرسال الفاتورة عبر واتساب للعميل
                </button>
                <button
                  onClick={() => setDoneInvoice(null)}
                  className="w-full btn-ghost !py-3 text-xs font-black"
                >
                  إتمام عملية جديدة
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
