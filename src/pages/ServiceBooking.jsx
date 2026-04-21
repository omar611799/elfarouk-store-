import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { db } from '../firebase/config'
import { COLS } from '../firebase/collections'
import { useStore } from '../context/StoreContext'
import { auth } from '../firebase/config'
import { BadgeCheck, CalendarDays, ClipboardCheck, CreditCard, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'

const PAYMENT_LINK = 'https://ipn.eg/01115329887'
const PAYMENT_NUMBER = '01115329887'
const COMPLAINTS_PHONE = '01127930685'
const INSTAPAY_LINK = PAYMENT_LINK
const WALLET_LINK = `https://wa.me/2${PAYMENT_NUMBER}?text=${encodeURIComponent('مساء الخير، عايز أحوّل عربون الصيانة 50 جنيه على المحفظة')}`
const LIVE_SITE_URL = 'https://elfarouk-store.vercel.app'
const BOOKING_PAGE_URL = `${LIVE_SITE_URL}/customer/booking`
const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']

export default function ServiceBooking() {
  const { serviceBookings, serviceMessages, notifications, addServiceBooking, addServiceMessage, markNotificationAsRead } = useStore()
  const [form, setForm] = useState({ name: '', phone: '', carModel: '', notes: '', slot: SERVICE_SLOTS[0], day: '' })
  const [bookingId, setBookingId] = useState('')
  const [chatText, setChatText] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    setSessionChecked(true)
  }, [])

  const reservedSlotsToday = useMemo(() => {
    if (!form.day) return []
    return serviceBookings
      .filter(b => b.day === form.day && b.status !== 'cancelled')
      .map(b => b.slot)
  }, [serviceBookings, form.day])

  const availableSlots = SERVICE_SLOTS.filter(slot => !reservedSlotsToday.includes(slot))

  const bookingMessages = useMemo(() => {
    if (!bookingId) return []
    return serviceMessages
      .filter(m => m.bookingId === bookingId)
      .sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        return da - db
      })
  }, [serviceMessages, bookingId])

  const myNotifications = useMemo(() => {
    if (!bookingId) return []
    return notifications.filter(n => n.audience === 'customer' && n.bookingId === bookingId)
  }, [notifications, bookingId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const existing = await getDocs(
        query(
          collection(db, COLS.SERVICE_BOOKINGS),
          where('customerAuthUid', '==', auth.currentUser.uid)
        )
      )
      if (!existing.empty) {
        setBookingId(existing.docs[0].id)
        return
      }

      if (!availableSlots.includes(form.slot)) throw new Error('المكان المختار محجوز بالفعل')

      const id = await addServiceBooking({
        ...form,
        customerAuthUid: auth.currentUser.uid,
        slotPrice: 50,
        paymentLink: PAYMENT_LINK,
        paymentStatus: 'pending',
        status: 'new',
      })
      await addServiceMessage({
        bookingId: id,
        sender: 'system',
        customerAuthUid: auth.currentUser.uid,
        text: `تم فتح الشات. للدفع: InstaPay/محافظ على رقم ${PAYMENT_NUMBER} بمبلغ 50 جنيه، ثم أرسل لقطة التحويل هنا. رابط الحجز الرسمي: ${BOOKING_PAGE_URL}`,
      })
      setBookingId(id)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!bookingId || !chatText.trim()) return
    await addServiceMessage({ bookingId, sender: 'customer', customerAuthUid: auth.currentUser.uid, text: chatText.trim() })
    setChatText('')
  }

  const handlePaymentSubmitted = async () => {
    if (!bookingId) return
    await addServiceMessage({
      bookingId,
      sender: 'customer',
      customerAuthUid: auth.currentUser.uid,
      text: `تم إرسال تحويل عربون 50 جنيه. ${paymentNote ? `ملاحظات: ${paymentNote}` : ''}`,
    })
    setPaymentNote('')
    toast.success('تم إرسال إشعار الدفع للإدارة')
  }

  const copyPaymentNumber = async () => {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    toast.success('تم نسخ رقم الدفع')
  }

  const handleInstallApp = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    setInstallEvent(null)
  }

  const handleCustomerLogout = () => {
    auth.signOut()
    window.location.href = '/customer/login'
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
        <div className="max-w-md mx-auto mt-10 card p-6">
          <p className="text-sm text-slate-400">جارٍ التحقق من حساب العميل...</p>
        </div>
      </div>
    )
  }

  if (!auth.currentUser) {
    return <Navigate to="/customer/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card border-primary-200 bg-gradient-to-b from-white to-slate-50 p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">ELFAROUK SERVICE</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">حجز صيانة محترف</h1>
            </div>
            <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
              <Wrench size={20} />
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-600" /> الحساب مفعل وجاهز</p>
            <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary-600" /> حجز آمن ومؤكد</p>
            <p className="flex items-center gap-2"><CalendarDays size={14} className="text-primary-600" /> 3 أماكن فقط يوميًا</p>
            <p className="flex items-center gap-2"><CreditCard size={14} className="text-primary-600" /> عربون ثابت 50 جنيه</p>
          </div>

          <p className="mt-3 text-sm text-slate-500">لينك الحجز المباشر: <a href={BOOKING_PAGE_URL} target="_blank" rel="noreferrer" className="font-semibold text-primary-600">{BOOKING_PAGE_URL}</a></p>
          <p className="mt-1 text-sm text-slate-500">رقم الشكاوى: <a href={`tel:${COMPLAINTS_PHONE}`} className="font-semibold text-primary-600">{COMPLAINTS_PHONE}</a></p>
          <button type="button" onClick={handleCustomerLogout} className="btn-ghost mt-4">تبديل حساب العميل</button>
          {installEvent && (
            <button type="button" onClick={handleInstallApp} className="btn-primary mt-3">
              تثبيت تطبيق الحجز على الموبايل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900">بيانات الحجز</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="موديل العربية" value={form.carModel} onChange={(e) => setForm({ ...form, carModel: e.target.value })} />
            <input className="input" type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} required />
          </div>
          <select className="input" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} required>
            {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <textarea className="input min-h-24" placeholder="وصف المشكلة / الملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" className="btn-primary w-full py-3" disabled={loading || availableSlots.length === 0}>
            {loading ? 'جارٍ الحجز...' : 'تأكيد الحجز'}
          </button>
        </form>

        {bookingId && (
          <div className="card p-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <p className="font-bold">تم استلام طلبك بنجاح</p>
              <p className="mt-1 text-sm">كود الحجز: <span className="font-black">{bookingId.slice(-6).toUpperCase()}</span></p>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-amber-800">
              <p className="font-bold flex items-center gap-2"><ClipboardCheck size={15} /> تعليمات الدفع</p>
              <p className="text-sm">الرقم: <span className="font-black">{PAYMENT_NUMBER}</span></p>
              <p className="text-sm">المبلغ المطلوب: <span className="font-black">50 جنيه</span></p>
              <p className="text-xs">بعد التحويل أرسل "تم الدفع" مع آخر 4 أرقام من رقمك أو رقم العملية.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <a href={INSTAPAY_LINK} target="_blank" rel="noreferrer" className="btn-primary inline-flex justify-center py-3">الدفع عبر InstaPay</a>
              <a href={WALLET_LINK} target="_blank" rel="noreferrer" className="btn-ghost inline-flex justify-center py-3">الدفع عبر المحفظة</a>
              <button type="button" onClick={copyPaymentNumber} className="btn-ghost inline-flex justify-center sm:col-span-2">نسخ رقم الدفع</button>
            </div>

            <div className="border border-primary-500/20 rounded-xl p-4 space-y-2">
              <p className="font-bold text-primary-700">تأكيد التحويل</p>
              <input className="input" placeholder="أكتب ملاحظة الدفع أو رقم العملية" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
              <button type="button" onClick={handlePaymentSubmitted} className="btn-primary">تم التحويل - أرسل إشعار للإدارة</button>
            </div>

            <div className="border border-white/10 rounded-xl p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><BadgeCheck size={15} /> الإشعارات</h3>
              {myNotifications.length === 0 && <p className="text-xs text-slate-500">لا يوجد إشعارات جديدة</p>}
              <div className="space-y-2">
                {myNotifications.slice(0, 5).map(n => (
                  <button key={n.id} type="button" className={`w-full text-right rounded-lg p-2 ${n.read ? 'bg-slate-900/60' : 'bg-primary-500/10 border border-primary-500/30'}`} onClick={() => !n.read && markNotificationAsRead(n.id)}>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-slate-400">{n.body}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-white/10 rounded-xl p-4">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><MessageCircle size={15} /> شات مع الإدارة</h2>
              <p className="text-xs text-slate-400 mb-3">افتح صفحة الحجز بنفس رقم الهاتف لمتابعة الردود.</p>
              <div className="space-y-2 max-h-56 overflow-auto mb-3">
                {bookingMessages.map(m => (
                  <div key={m.id} className={`text-sm p-2 rounded-lg ${m.sender === 'admin' ? 'bg-primary-100 text-slate-900 mr-8' : 'bg-slate-100 text-slate-900 ml-8'}`}>
                    <p className="font-semibold mb-1">{m.sender === 'admin' ? 'الإدارة' : m.sender === 'system' ? 'النظام' : 'أنت'}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="اكتب رسالتك" value={chatText} onChange={(e) => setChatText(e.target.value)} />
                <button type="button" className="btn-primary" onClick={handleSendMessage}>إرسال</button>
              </div>
            </div>
            <Link to="/customer/login" className="text-sm font-bold text-primary-600">العودة لحساب العميل</Link>
          </div>
        )}
      </div>
    </div>
  )
}
