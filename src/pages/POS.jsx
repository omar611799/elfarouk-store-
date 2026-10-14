import { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, X, Users, 
  ChevronLeft, Send, MessageCircle, Camera, Sparkles,
  Wallet, CreditCard, Landmark, Wrench, Printer, AlertTriangle,
  Package, Receipt, FolderSync, Clock, RotateCcw, Edit3, Tag, Check, CheckCircle2,
  Smartphone, Zap, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'
import { normalizeEgyptianPhone, formatPhoneForWhatsApp } from '../utils/phone'

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
  'سوست': '🔩', 'عفشة': '🚗', 'زيوت': '🛢️', 'فلاتر': '🔧', 'بطاريات': '🔋',
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
    const phone = formatPhoneForWhatsApp(invoice.customerPhone) || '201115329887'
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
   PRICE OVERRIDE MODAL — Edit selling price on the fly
   ═══════════════════════════════════════════════════════════════ */
const PriceOverrideModal = memo(({ item, onClose, onApply, isAdmin }) => {
  if (!item) return null

  const originalPrice = Number(item.originalPrice ?? item.price ?? 0)
  const cost = Number(item.cost || 0)
  const qty = Number(item.qty || 1)

  const [inputPrice, setInputPrice] = useState(() => String(item.price ?? originalPrice))
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const currentPriceNum = Math.max(0, Number(inputPrice) || 0)
  const lineTotal = currentPriceNum * qty
  const profitPerUnit = currentPriceNum - cost
  const isBelowCost = cost > 0 && currentPriceNum < cost
  const isDiscounted = currentPriceNum < originalPrice
  const isMarkedUp = currentPriceNum > originalPrice
  const discountAmount = Math.max(0, originalPrice - currentPriceNum)
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0

  const handleQuickPercent = (percent) => {
    const discounted = Math.round(originalPrice * (1 - percent / 100))
    setInputPrice(String(discounted))
  }

  const handleQuickAmount = (amount) => {
    const discounted = Math.max(0, originalPrice - amount)
    setInputPrice(String(discounted))
  }

  const handleReset = () => {
    setInputPrice(String(originalPrice))
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    const parsed = parseFloat(inputPrice)
    if (isNaN(parsed) || parsed < 0) {
      toast.error('يرجى إدخال سعر صحيح (0 أو أكبر)')
      return
    }
    onApply(item.id, parsed)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-end sm:items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 font-display"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-white">تعديل سعر البيع</h3>
                <p className="text-xs text-slate-300 font-medium truncate max-w-[240px]">{item.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Item Meta Pills */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">السعر الأصلي</span>
              <span className="text-sm font-black text-slate-700">{originalPrice.toLocaleString('en-US')} ج</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">الكمية</span>
              <span className="text-sm font-black text-slate-700">{qty} قطعة</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {isAdmin ? 'سعر التكلفة' : 'الفئة'}
              </span>
              <span className="text-sm font-black text-slate-700">
                {isAdmin ? `${cost.toLocaleString('en-US')} ج` : (item.category || 'عام')}
              </span>
            </div>
          </div>

          {/* New Price Input Field */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              سعر البيع الجديد للقطعة (ج.م) *
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                value={inputPrice}
                onChange={e => setInputPrice(e.target.value)}
                placeholder="أدخل سعر البيع الجديد..."
                className="w-full bg-slate-50 border-2 border-primary-500 rounded-2xl py-3 px-4 text-2xl font-black text-slate-900 text-left font-mono focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm pointer-events-none">
                ج.م
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
              اختصارات وتخفيضات سريعة:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-all active:scale-95"
              >
                <RotateCcw size={12} /> السعر الأصلي
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(5)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all active:scale-95"
              >
                -5 ج.م
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(10)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all active:scale-95"
              >
                -10 ج.م
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(20)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all active:scale-95"
              >
                -20 ج.م
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(5)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all active:scale-95"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(10)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all active:scale-95"
              >
                -10%
              </button>
            </div>
          </div>

          {/* Profit / Discount / Warning summary card */}
          <div className="space-y-2">
            {isBelowCost ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs">
                <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                <div>
                  <p className="font-black">تحذير: السعر أقل من سعر التكلفة!</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    التكلفة {cost} ج.م — البيع بهذا السعر يسبب خسارة {(cost - currentPriceNum).toLocaleString()} ج.م للقطعة.
                  </p>
                </div>
              </div>
            ) : isDiscounted ? (
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <span className="font-bold">خصم مخصص:</span>
                <span className="font-black font-mono">
                  -{discountAmount.toLocaleString()} ج.م ({discountPercent}%) للقطعة
                </span>
              </div>
            ) : isMarkedUp ? (
              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                <span className="font-bold">زيادة عن السعر الرسمي:</span>
                <span className="font-black font-mono">
                  +{(currentPriceNum - originalPrice).toLocaleString()} ج.م للقطعة
                </span>
              </div>
            ) : null}

            {/* Total Calculation Row */}
            <div className="p-3 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إجمالي الصنف بالفاتورة</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5 font-mono">
                  {qty} قطعة × {currentPriceNum.toLocaleString()} ج.م
                </p>
              </div>
              <div className="text-left">
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {lineTotal.toLocaleString('en-US')} <span className="text-xs text-slate-300 font-sans">ج.م</span>
                </p>
                {isAdmin && cost > 0 && (
                  <p className="text-[10px] text-slate-300">
                    الربح الصافي: {(profitPerUnit * qty).toLocaleString()} ج
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-xs shadow-lg shadow-primary-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check size={16} /> تطبيق السعر
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
})
PriceOverrideModal.displayName = 'PriceOverrideModal'


/* ═══════════════════════════════════════════════════════════════
   CART CONTENT — Side panel / mobile bottom sheet
   ═══════════════════════════════════════════════════════════════ */
const CartContent = memo(({
  cart, cartTotal, cartClear, cartQty, cartRemove, cartPrice, onOpenPriceModal,
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
  const [showCustomerDetails, setShowCustomerDetails] = useState(() => Boolean(customer.name || customer.phone))

  const totalPaid = Number(payments.cash || 0) + Number(payments.visa || 0) + Number(payments.instapay || 0) + Number(payments.wallet || 0)
  const discount = Number(payments.discount || 0)
  const finalTotal = cartTotal - discount
  const remaining = finalTotal - totalPaid

  /* Customer debt from invoices */
  const customerDebt = useMemo(() => {
    if (!customer.name && !customer.phone) return 0
    const normPhone = normalizeEgyptianPhone(customer.phone)
    return invoices.filter(inv => {
      const invPhone = normalizeEgyptianPhone(inv.customerData?.phone || '')
      const matchPhone = normPhone && invPhone && invPhone === normPhone
      const matchName = !normPhone && customer.name && inv.customerData?.name?.toLowerCase() === customer.name?.toLowerCase()
      return (matchPhone || matchName) && inv.paymentStatus !== 'paid'
    }).reduce((sum, inv) => sum + (inv.dueAmount || 0), 0)
  }, [invoices, customer.name, customer.phone])

  const matchedCustomerHistory = useMemo(() => {
    if (!customer.name && !customer.phone) return []
    const normPhone = normalizeEgyptianPhone(customer.phone)
    return invoices.filter(inv => {
      const invPhone = normalizeEgyptianPhone(inv.customerData?.phone || '')
      return (normPhone && invPhone && invPhone === normPhone) ||
        (!normPhone && customer.name && inv.customerData?.name?.toLowerCase() === customer.name?.toLowerCase())
    }).sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
      const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
      return db - da
    })
  }, [invoices, customer.name, customer.phone])

  /* Auto-fill remaining for payment method */
  const fillRemaining = (method) => {
    const otherPaid = totalPaid - Number(payments[method] || 0)
    const leftover = finalTotal - otherPaid
    const amountToSet = leftover > 0 ? leftover : finalTotal
    setPayments(p => ({ ...p, [method]: String(amountToSet) }))
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
          <CreditCard size={14} /> طريقة الدفع
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
                      
                      {/* Price button with quick edit trigger */}
                      <div className="flex items-center flex-wrap gap-1.5 mt-1 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => onOpenPriceModal?.(item)}
                          className={`group/price flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-right transition-all active:scale-95 ${
                            item.isCustomPrice
                              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                              : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:border-emerald-300'
                          }`}
                          title="انقر لتعديل سعر البيع لهذا الصنف"
                        >
                          {item.isCustomPrice && item.originalPrice !== undefined && item.originalPrice !== item.price && (
                            <span className="text-[11px] line-through text-slate-400 font-bold font-mono">
                              {Number(item.originalPrice).toLocaleString('en-US')}
                            </span>
                          )}
                          <span className="text-sm font-black tracking-tight font-display">
                            {Number(item.price).toLocaleString('en-US')} ج.م
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                            item.isCustomPrice ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200/70 text-emerald-900'
                          }`}>
                            {item.isCustomPrice ? '🏷️ معدل' : '✏️ تعديل'}
                          </span>
                        </button>

                        {item.isCustomPrice && (
                          <button
                            type="button"
                            onClick={() => {
                              cartPrice(item.id, item.originalPrice)
                              toast.success('تمت استعادة السعر الأصلي')
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            title="استعادة السعر الأساسي"
                          >
                            <RotateCcw size={10} /> استعادة
                          </button>
                        )}
                      </div>

                      {isAdmin && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-1 ${
                          (item.price - (item.cost || 0)) < 0 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          الربح: {((item.price - (item.cost || 0)) * item.qty).toLocaleString()} ج
                          {(item.price - (item.cost || 0)) < 0 && ' (خسارة ⚠️)'}
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
            {/* ─── PAYMENT METHODS (FRONT & CENTER) ─── */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-800 font-black flex items-center gap-1.5">
                  <CreditCard size={15} className="text-primary-600" /> طريقة الدفع
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  (اختر الطريقة أو وزّع المبلغ)
                </span>
              </div>
              
              {/* 4 Interactive Payment Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'cash', label: 'كاش', sub: 'نقدي', icon: Wallet, color: 'emerald', bg: 'from-emerald-50 to-emerald-100/60', border: 'border-emerald-300 ring-2 ring-emerald-400/30', text: 'text-emerald-800', iconColor: 'text-emerald-600', badgeBg: 'bg-emerald-500' },
                  { key: 'instapay', label: 'إنستاباي', sub: 'تحويل لحظي', icon: Zap, color: 'purple', bg: 'from-purple-50 to-purple-100/60', border: 'border-purple-300 ring-2 ring-purple-400/30', text: 'text-purple-800', iconColor: 'text-purple-600', badgeBg: 'bg-purple-500' },
                  { key: 'wallet', label: 'محفظة', sub: 'فودافون كاش', icon: Smartphone, color: 'rose', bg: 'from-rose-50 to-rose-100/60', border: 'border-rose-300 ring-2 ring-rose-400/30', text: 'text-rose-800', iconColor: 'text-rose-600', badgeBg: 'bg-rose-500' },
                  { key: 'visa', label: 'فيزا', sub: 'بطاقة بنكية', icon: CreditCard, color: 'blue', bg: 'from-blue-50 to-blue-100/60', border: 'border-blue-300 ring-2 ring-blue-400/30', text: 'text-blue-800', iconColor: 'text-blue-600', badgeBg: 'bg-blue-500' },
                ].map(pm => {
                  const Icon = pm.icon
                  const val = Number(payments[pm.key] || 0)
                  const hasValue = val > 0
                  return (
                    <div key={pm.key} className="space-y-1.5">
                      {/* Quick-fill button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (val === finalTotal) {
                            setPayments(p => ({ ...p, [pm.key]: '' }))
                          } else {
                            fillRemaining(pm.key)
                          }
                        }}
                        className={`w-full rounded-2xl border p-2.5 transition-all flex flex-col items-center gap-1 group/pm active:scale-95 text-center relative ${
                          hasValue 
                            ? `${pm.border} bg-gradient-to-b ${pm.bg} shadow-sm` 
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        {hasValue && (
                          <span className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-full ${pm.badgeBg} text-white flex items-center justify-center text-[9px] shadow-sm`}>
                            ✓
                          </span>
                        )}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasValue ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                          <Icon size={16} className={hasValue ? pm.iconColor : 'text-slate-400 group-hover/pm:text-slate-600'} />
                        </div>
                        <span className={`text-[11px] font-black ${hasValue ? pm.text : 'text-slate-700'}`}>
                          {pm.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold leading-none">
                          {pm.sub}
                        </span>
                      </button>

                      {/* Amount input */}
                      <div className="relative">
                        <input
                          type="number"
                          value={payments[pm.key] ?? ''}
                          onChange={e => setPayments(p => ({ ...p, [pm.key]: e.target.value }))}
                          placeholder="0"
                          className={`input !py-1.5 text-center text-xs font-black !rounded-xl ${
                            hasValue ? `!bg-${pm.color}-50/60 !border-${pm.color}-300 text-slate-900 font-mono` : ''
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Payment Progress Bar */}
              {finalTotal > 0 && (
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">المدفوع الإجمالي</span>
                    <span className={totalPaid >= finalTotal ? 'text-emerald-600' : totalPaid > 0 ? 'text-amber-600' : 'text-slate-400'}>
                      {totalPaid.toLocaleString()} / {finalTotal.toLocaleString()} ج.م
                      {totalPaid === 0 && ' (كاش بالكامل افتراضياً)'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
                  {remaining > 0 && totalPaid > 0 && (
                    <div className="flex justify-between items-center px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-black uppercase">مديونية متبقية (آجل)</span>
                      <span className="text-sm font-black text-rose-600 font-mono">{remaining.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  {remaining < 0 && (
                    <div className="flex justify-between items-center px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 font-black uppercase">الباقي للعميل (فكة)</span>
                      <span className="text-sm font-black text-blue-600 font-mono">{Math.abs(remaining).toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── CUSTOMER DATA (OPTIONAL ACCORDION) ─── */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all">
              <button
                type="button"
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                className="w-full px-4 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-right transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${customer.name ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'}`}>
                    <Users size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      بيانات العميل <span className="text-[10px] font-bold text-slate-400">(اختياري)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-0.5">
                      {customer.name ? `العميل: ${customer.name}` : 'الافتراضي: عميل نقدي (بدون تسجيل بيانات)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {customer.name ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-black">
                      محدد ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                      عميل نقدي
                    </span>
                  )}
                  {showCustomerDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {showCustomerDetails && (
                <div className="p-4 space-y-3.5 border-t border-slate-100 bg-white">
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

                  {/* Fields */}
                  <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">اسم العميل (اختياري)</label>
                    <div className="relative group">
                      <input id="customer-name-input" value={customer.name}
                        onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                        placeholder="اتركه فارغاً لـ 'عميل نقدي' أو اكتب اسمه" className="input !py-3 pr-11 text-sm font-bold" autoComplete="off" />
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
                        placeholder="01xxxxxxxxx" className="input !py-3 text-sm font-bold" autoComplete="off" />
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
                        placeholder="29xxx..." className="input !py-3 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">رقم اللوحة</label>
                      <input id="customer-license-input" value={customer.licensePlate}
                        onChange={e => setCustomer(p => ({ ...p, licensePlate: e.target.value }))}
                        placeholder="أ ب ج 123" className="input !py-3 text-sm font-bold" />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 block">نوع السيارة والموديل</label>
                    <div className="relative">
                      <input id="customer-car-input" value={customer.carModel}
                        onChange={e => setCustomer(p => ({ ...p, carModel: e.target.value }))}
                        onFocus={() => setShowCarSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCarSuggestions(false), 200)}
                        placeholder="لانسر بومة 2008" className="input !py-3 text-sm font-bold" autoComplete="off" />
                      
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
                </div>
              )}
            </div>

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
                          أ/ {customer.name || 'عميل نقدي'} {customer.carModel ? `| ${customer.carModel}` : ''}
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSale('cash')}
                disabled={cart.length === 0 || saving}
                className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-20 shrink-0"
                title="إنهاء البيع فوراً كاش بدون أي خطوات إضافية"
              >
                <Zap size={15} className="fill-current text-amber-300" /> كاش فوري
              </button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('checkout')} disabled={cart.length === 0}
                className="flex-1 btn-primary !py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider disabled:opacity-20">
                طريقة الدفع ←
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setActiveTab('cart')}
                className="btn-ghost !py-3.5 text-xs font-black uppercase tracking-wider px-3 flex items-center gap-1.5">
                ← السلة
              </button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleSale()} disabled={cart.length === 0 || saving}
                className="btn-primary !py-3.5 flex-1 text-sm font-black uppercase tracking-[0.1em] shadow-neon disabled:opacity-20 active:scale-95 flex items-center justify-center gap-2">
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
    products, cart, cartAdd, cartRemove, cartQty, cartPrice, cartClear, cartTotal,
    completeSale, customers, invoices
  } = useStore()
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const [search, setSearch] = useState('')
  const [catFilter, setCat] = useState('')
  const [customer, setCustomer] = useState({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
  const [payments, setPayments] = useState({ cash: '', visa: '', instapay: '', wallet: '', discount: '' })
  const [saving, setSaving] = useState(false)
  const [doneInvoice, setDoneInvoice] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [reminders, setReminders] = useState({})
  const [itemWeights, setItemWeightsState] = useState({})
  const [unitSelectProduct, setUnitSelectProduct] = useState(null) // for box/piece selection
  const [priceModalItem, setPriceModalItem] = useState(null) // for overriding price

  const handleOpenPriceModal = useCallback((item) => {
    setPriceModalItem(item)
  }, [])

  const handleAddWithCustomPrice = useCallback((p) => {
    if (p.hasSubUnits) {
      setUnitSelectProduct(p)
      return
    }
    const existing = cart.find(i => i.id === p.id)
    if (!existing) {
      cartAdd(p)
      setPriceModalItem({
        ...p,
        qty: 1,
        originalPrice: p.price,
        price: p.price
      })
    } else {
      setPriceModalItem(existing)
    }
  }, [cart, cartAdd])

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

  /* ─── Smart Automotive & Commercial Truck Filtered products ─── */
  const filtered = useMemo(() => {
    const rawSearch = (search || '').toLowerCase().trim()
    if (!rawSearch && !catFilter) return products.filter(p => p.quantity > 0)

    const norm = (str = '') =>
      String(str)
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ى]/g, 'ي')
        .trim()

    const q = norm(rawSearch)
    const terms = q.split(/\s+/).filter(Boolean)

    // Expand common automotive aliases for Egyptian commercial transport
    const isDababa = q.includes('دباب') || q.includes('tfr') || q.includes('tfs') || q.includes('شفر')
    const isJumbo = q.includes('جامبو') || q.includes('npr') || q.includes('nqr') || q.includes('7000') || q.includes('8000')
    const isDmax = q.includes('ديماكس') || q.includes('dmax') || q.includes('d-max') || q.includes('اسوزو') || q.includes('ايسوزو')
    const isHilux = q.includes('هايلكس') || q.includes('هايلوكس') || q.includes('هيلوكس') || q.includes('hilux')
    const isCanter = q.includes('كانتر') || q.includes('canter') || q.includes('فوسو')
    const isVan = q.includes('تمناي') || q.includes('تُمناي') || q.includes('فان') || q.includes('n300')
    const isBrake = q.includes('تيل') || q.includes('فرامل') || q.includes('brakes')
    const isSpring = q.includes('سوست') || q.includes('ورق') || q.includes('شنكل') || q.includes('افييز')
    const isClutch = q.includes('دبرياج') || q.includes('اسطوان') || q.includes('ديسك')
    const isFilter = q.includes('فلتر') || q.includes('صفاي') || q.includes('فاصل')
    const isCross = q.includes('صلايب') || q.includes('صليب') || q.includes('كردان')
    const isCrown = q.includes('كرون') || q.includes('دفرنس') || q.includes('تاجي')

    return products.filter(p => {
      if (p.quantity <= 0) return false
      const matchCat = !catFilter || p.category === catFilter
      if (!matchCat) return false
      if (terms.length === 0) return true

      const nameN = norm(p.name || '')
      const skuN = norm(p.sku || '')
      const catN = norm(p.category || '')
      const brandN = norm(p.brand || '')
      const oemN = norm(p.oemPartNumber || '')

      // 1. Direct text match
      const directMatch = terms.every(t =>
        nameN.includes(t) || skuN.includes(t) || catN.includes(t) || brandN.includes(t) || oemN.includes(t)
      )
      if (directMatch) return true

      // 2. Compatibility Array Match
      if (Array.isArray(p.compatibility) && p.compatibility.length > 0) {
        const compMatch = p.compatibility.some(c => {
          const makeN = norm(c.make || '')
          const modelN = norm(c.model || '')
          return terms.some(t => makeN.includes(t) || modelN.includes(t) || t.includes(modelN))
        })
        if (compMatch) return true
      }

      // 3. Smart Commercial Truck Aliases
      if (isDababa && (nameN.includes('دباب') || nameN.includes('tfr') || nameN.includes('tfs') || nameN.includes('شفر') || norm(p.carModel).includes('دباب'))) return true
      if (isJumbo && (nameN.includes('جامبو') || nameN.includes('npr') || nameN.includes('nqr') || norm(p.carModel).includes('جامبو'))) return true
      if (isDmax && (nameN.includes('ديماكس') || nameN.includes('dmax') || nameN.includes('isuzu') || norm(p.carModel).includes('ديماكس'))) return true
      if (isHilux && (nameN.includes('هيلوكس') || nameN.includes('hilux') || nameN.includes('هايلكس') || norm(p.carModel).includes('هيلوكس'))) return true
      if (isCanter && (nameN.includes('كانتر') || nameN.includes('canter') || norm(p.carModel).includes('كانتر'))) return true
      if (isVan && (nameN.includes('تمناي') || nameN.includes('فان') || nameN.includes('n300') || nameN.includes('سوزوكي'))) return true

      // 4. Smart Part Type Aliases
      if (isBrake && (nameN.includes('تيل') || nameN.includes('فرامل') || catN.includes('فرامل') || p.partType === 'brake_pads')) return true
      if (isSpring && (nameN.includes('سوست') || nameN.includes('ورق') || p.partType === 'leaf_springs')) return true
      if (isClutch && (nameN.includes('دبرياج') || nameN.includes('اسطوان') || nameN.includes('ديسك') || p.partType === 'clutch_kit')) return true
      if (isFilter && (nameN.includes('فلتر') || nameN.includes('صفاي') || p.partType?.includes('filter'))) return true
      if (isCross && (nameN.includes('صلايب') || nameN.includes('صليب') || nameN.includes('كردان') || p.partType === 'propeller_shaft_cross')) return true
      if (isCrown && (nameN.includes('كرون') || nameN.includes('دفرنس') || p.partType === 'differential_crown')) return true

      return false
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
  const handleSale = useCallback(async (forcedMethod = null) => {
    if (cart.length === 0) return
    setSaving(true)
    try {
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

      let finalPayments = {
        cash: Number(payments.cash || 0),
        visa: Number(payments.visa || 0),
        instapay: Number(payments.instapay || 0),
        wallet: Number(payments.wallet || 0)
      }

      // If a specific method was forced (e.g. 1-click cash button)
      if (typeof forcedMethod === 'string' && ['cash', 'visa', 'instapay', 'wallet'].includes(forcedMethod)) {
        finalPayments = { cash: 0, visa: 0, instapay: 0, wallet: 0, [forcedMethod]: finalTotal }
      }

      let totalPaid = finalPayments.cash + finalPayments.visa + finalPayments.instapay + finalPayments.wallet

      // Default to cash in full if no payment was explicitly typed/selected
      if (totalPaid === 0 && finalTotal > 0) {
        finalPayments.cash = finalTotal
        totalPaid = finalTotal
      }

      const dueAmount = Math.max(0, finalTotal - totalPaid)
      const customerName = customer.name?.trim() || 'عميل نقدي'
      const customerData = {
        ...customer,
        name: customerName
      }

      const { id: invId, number: invNum } = await completeSale({
        customerData,
        items: cart.map(i => ({ ...i, reminderMonths: reminders[i.id] || 0 })),
        total: finalTotal,
        paidAmount: totalPaid,
        dueAmount,
        payments: finalPayments
      })

      setDoneInvoice({
        id: invId,
        number: invNum,
        total: finalTotal,
        due: dueAmount,
        customerPhone: customer.phone,
        customerName: customerName,
        customerCar: customer.carModel,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      })

      setCustomer({ name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
      setPayments({ cash: '', visa: '', instapay: '', wallet: '', discount: '' })
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
        () => {}
      ).catch(() => {
        setScannerError('تعذر فتح الكاميرا. تأكد من إعطاء الصلاحية.')
      })
    }
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(() => {})
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
    // unit: 'set' | 'box' | 'piece'
    const boxesPerSet = Number(p.boxesPerSet || 2)
    const piecesPerBox = Number(p.piecesPerBox || 2)
    const totalPiecesInSet = boxesPerSet * piecesPerBox

    if (unit === 'set') {
      const setItem = {
        ...p,
        id: p.id + '_set',
        name: p.name + ' (طقم كامل)',
        price: Number(p.price),
        cost: Number(p.cost || p.price),
        _originalId: p.id,
        _unit: 'set',
        _piecesPerBox: totalPiecesInSet,
      }
      cartAdd(setItem)
    } else if (unit === 'box') {
      const boxPrice = Number(p.boxPrice || (p.price / boxesPerSet))
      const boxCost = Number(p.boxCost || (p.cost / boxesPerSet))
      const boxItem = {
        ...p,
        id: p.id + '_box',
        name: p.name + ' (علبة - ' + piecesPerBox + ' قطعة)',
        price: boxPrice,
        cost: boxCost,
        _originalId: p.id,
        _unit: 'box',
        _piecesPerBox: piecesPerBox,
      }
      cartAdd(boxItem)
    } else {
      // piece
      const piecePrice = Number(p.piecePrice || (p.price / totalPiecesInSet))
      const pieceCost = Number(p.pieceCost || (p.cost / totalPiecesInSet))
      const pieceItem = {
        ...p,
        id: p.id + '_piece',
        name: p.name + ' (قطعة مفردة)',
        price: piecePrice,
        cost: pieceCost,
        _originalId: p.id,
        _unit: 'piece',
        _piecesPerBox: 1,
      }
      cartAdd(pieceItem)
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
        originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price,
        isCustomPrice: !!item.isCustomPrice,
        cost: item.cost || 0,
        category: item.category || 'عام',
        quantity: item.quantity || 999,
        qty: item.qty
      }
      cartAdd(productObj)
      if (item.qty > 1) {
        cartQty(item.id, item.qty)
      }
    })
    setCustomer(suspended.customer || { name: '', phone: '', carModel: '', licensePlate: '', nationalId: '' })
    setPayments(suspended.payments || { cash: '', visa: '', instapay: '', wallet: '', discount: '' })
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
    cart, cartTotal, cartClear, cartQty, cartRemove, cartPrice,
    onOpenPriceModal: handleOpenPriceModal,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments, isAdmin,
    saving, handleSale, setIsCartOpen,
    invoices,
    // suspended features
    suspendedCarts, handleSuspendCart, handleResumeCart, handleDeleteSuspended
  }), [
    cart, cartTotal, cartClear, cartQty, cartRemove, cartPrice,
    handleOpenPriceModal,
    customer, setCustomer, suggestedCustomers,
    payments, setPayments, isAdmin,
    saving, handleSale, setIsCartOpen,
    invoices,
    suspendedCarts, handleSuspendCart, handleResumeCart, handleDeleteSuspended
  ])


  /* ═══ MAIN POS LAYOUT ═══ */
  return (
    <div className="flex min-h-full flex-col overflow-hidden bg-[#f1f5f9] font-display xl:h-full xl:flex-row" dir="rtl">

      {/* ===== Unit Selection Modal (Set / Box / Piece) ===== */}
      <AnimatePresence>
        {unitSelectProduct && (() => {
          const isSetProduct = (Number(unitSelectProduct.boxesPerSet) || 0) > 1 || unitSelectProduct.name?.includes('طقم')
          const boxesPerSet = Number(unitSelectProduct.boxesPerSet || 2)
          const piecesPerBox = Number(unitSelectProduct.piecesPerBox || 2)
          const totalPieces = boxesPerSet * piecesPerBox
          const setPrice = Number(unitSelectProduct.price)
          const boxPrice = Number(unitSelectProduct.boxPrice || (setPrice / boxesPerSet))
          const piecePrice = Number(unitSelectProduct.piecePrice || (setPrice / totalPieces))

          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
              onClick={() => setUnitSelectProduct(null)}
            >
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <h3 className="text-xl font-black text-slate-900 text-center mb-1 font-display">{unitSelectProduct.name}</h3>
                <p className="text-xs text-slate-500 text-center mb-5 font-bold">
                  {isSetProduct ? 'الطقم يتكون من علبتين وكل علبة قطعتين (4 قطع) — اختر وحدة البيع:' : 'اختر وحدة البيع المطلوبة:'}
                </p>

                {isSetProduct ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Option 1: Full Set */}
                    <button
                      type="button"
                      onClick={() => handleCartAddWithUnit(unitSelectProduct, 'set')}
                      className="group flex flex-col items-center justify-between p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 hover:border-emerald-500 active:scale-95 transition-all shadow-sm text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-200/60 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                        📦📦
                      </div>
                      <div>
                        <span className="block font-black text-emerald-950 text-sm">طقم كامل</span>
                        <span className="block text-[11px] text-emerald-700 font-bold mb-1">علبتين (4 قطع)</span>
                      </div>
                      <span className="mt-1 inline-block px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm">
                        {setPrice.toLocaleString()} ج.م
                      </span>
                    </button>

                    {/* Option 2: 1 Box */}
                    <button
                      type="button"
                      onClick={() => handleCartAddWithUnit(unitSelectProduct, 'box')}
                      className="group flex flex-col items-center justify-between p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/60 hover:bg-amber-100/80 hover:border-amber-500 active:scale-95 transition-all shadow-sm text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-200/60 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                        📦
                      </div>
                      <div>
                        <span className="block font-black text-amber-950 text-sm">علبة واحدة</span>
                        <span className="block text-[11px] text-amber-700 font-bold mb-1">قطعتين (2 قطعة)</span>
                      </div>
                      <span className="mt-1 inline-block px-2.5 py-1 rounded-xl bg-amber-600 text-white text-xs font-black shadow-sm">
                        {boxPrice.toLocaleString()} ج.م
                      </span>
                    </button>

                    {/* Option 3: 1 Piece */}
                    <button
                      type="button"
                      onClick={() => handleCartAddWithUnit(unitSelectProduct, 'piece')}
                      className="group flex flex-col items-center justify-between p-4 rounded-2xl border-2 border-blue-300 bg-blue-50/60 hover:bg-blue-100/80 hover:border-blue-500 active:scale-95 transition-all shadow-sm text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-200/60 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                        🔩
                      </div>
                      <div>
                        <span className="block font-black text-blue-950 text-sm">قطعة مفردة</span>
                        <span className="block text-[11px] text-blue-700 font-bold mb-1">فردة واحدة</span>
                      </div>
                      <span className="mt-1 inline-block px-2.5 py-1 rounded-xl bg-blue-600 text-white text-xs font-black shadow-sm">
                        {piecePrice.toLocaleString()} ج.م
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCartAddWithUnit(unitSelectProduct, 'piece')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      <span className="text-3xl">🔩</span>
                      <span className="font-black text-blue-700 text-sm">قطعة</span>
                      <span className="text-xs font-bold text-blue-500">{piecePrice.toLocaleString()} ج.م</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCartAddWithUnit(unitSelectProduct, 'box')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all"
                    >
                      <span className="text-3xl">📦</span>
                      <span className="font-black text-amber-700 text-sm">علبة ({piecesPerBox} قطعة)</span>
                      <span className="text-xs font-bold text-amber-500">{boxPrice.toLocaleString()} ج.م</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setUnitSelectProduct(null)}
                  className="mt-5 w-full text-xs text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors"
                >
                  إلغاء
                </button>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ===== Price Override Modal ===== */}
      <AnimatePresence>
        {priceModalItem && (
          <PriceOverrideModal
            item={priceModalItem}
            onClose={() => setPriceModalItem(null)}
            onApply={(id, newPrice) => {
              cartPrice(id, newPrice)
              toast.success(`تم تحديث سعر البيع إلى ${newPrice.toLocaleString()} ج.م`)
            }}
            isAdmin={isAdmin}
          />
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
            const inCartItem = cart.find(i => i.id === p.id || i._originalId === p.id)
            const inCart = inCartItem?.qty || cartMap[p.id] || 0
            const displayPrice = inCartItem ? inCartItem.price : p.price
            const isCustom = inCartItem?.isCustomPrice
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
                      <AlertTriangle size={10} />{' '}
                      {p.boxesPerSet
                        ? `${Math.floor(p.quantity / ((p.boxesPerSet || 2) * (p.piecesPerBox || 2)))} طقم`
                        : p.quantity}
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
                            {p.boxesPerSet
                              ? `متاح ${Math.floor(p.quantity / ((p.boxesPerSet || 2) * (p.piecesPerBox || 2)))} طقم (${p.quantity} ق)`
                              : `متاح ${p.quantity}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">السعر</p>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddWithCustomPrice(p)
                        }}
                        className="group/cardprice flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                        title="انقر لتعديل سعر البيع أو البيع بسعر مخصص"
                      >
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-primary-600 leading-none mt-0.5 flex items-center gap-1">
                          {Number(displayPrice).toLocaleString('en-US')}
                          <span className="mr-1 text-[10px] font-bold text-slate-400">ج.م</span>
                          <span className="text-[11px] text-slate-400 opacity-0 group-hover/cardprice:opacity-100 transition-opacity">✏️</span>
                        </p>
                        {isCustom && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
                            معدل
                          </span>
                        )}
                      </div>
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
                        <button onClick={(e) => { e.stopPropagation(); cartQty(inCartItem?.id || p.id, inCart - 1) }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform hover:bg-rose-50 hover:border-rose-200">
                          {inCart === 1 ? <Trash2 size={14} className="text-rose-500" /> : <Minus size={14} className="text-slate-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (inCartItem) handleOpenPriceModal(inCartItem)
                          }}
                          className="text-xs font-black text-primary-700 hover:text-primary-900 bg-white px-2.5 py-1 rounded-lg border border-primary-200 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                          title="تعديل سعر البيع لهذا الصنف"
                        >
                          <span>{inCart} في السلة</span>
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-bold">
                            ✏️ السعر
                          </span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cartQty(inCartItem?.id || p.id, inCart + 1) }}
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
                    const cleanPhone = formatPhoneForWhatsApp(phone)
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
