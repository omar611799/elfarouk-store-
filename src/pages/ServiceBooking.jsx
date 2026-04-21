import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLS } from '../firebase/collections'
import { useStore } from '../context/StoreContext'

const PAYMENT_LINK = 'https://ipn.eg/01115329887'
const PAYMENT_NUMBER = '01115329887'
const COMPLAINTS_PHONE = '01127930685'
const LIVE_SITE_URL = 'https://elfarouk-store.vercel.app'
const BOOKING_PAGE_URL = `${LIVE_SITE_URL}/service-booking`
const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']
const CUSTOMER_SESSION_KEY = 'elfarouk_customer_session'

export default function ServiceBooking() {
  const { serviceBookings, serviceMessages, addServiceBooking, addServiceMessage } = useStore()
  const [form, setForm] = useState({ name: '', phone: '', carModel: '', notes: '', slot: SERVICE_SLOTS[0], day: '' })
  const [bookingId, setBookingId] = useState('')
  const [chatText, setChatText] = useState('')
  const [loading, setLoading] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)
  const [customerSession, setCustomerSession] = useState(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_SESSION_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.phone) {
        setCustomerSession(parsed)
        setForm(prev => ({ ...prev, name: parsed.name || '', phone: parsed.phone || '' }))
      }
    } catch {
      localStorage.removeItem(CUSTOMER_SESSION_KEY)
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const existing = await getDocs(query(collection(db, COLS.SERVICE_BOOKINGS), where('phone', '==', form.phone)))
      if (!existing.empty) {
        setBookingId(existing.docs[0].id)
        return
      }

      if (!availableSlots.includes(form.slot)) throw new Error('المكان المختار محجوز بالفعل')

      const id = await addServiceBooking({
        ...form,
        slotPrice: 50,
        paymentLink: PAYMENT_LINK,
        paymentStatus: 'pending',
        status: 'new',
      })
      await addServiceMessage({
        bookingId: id,
        sender: 'system',
        text: `تم فتح الشات. للدفع: InstaPay/محافظ على رقم ${PAYMENT_NUMBER} بمبلغ 50 جنيه، ثم أرسل لقطة التحويل هنا. رابط الحجز الرسمي: ${BOOKING_PAGE_URL}`,
      })
      setBookingId(id)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!bookingId || !chatText.trim()) return
    await addServiceMessage({ bookingId, sender: 'customer', text: chatText.trim() })
    setChatText('')
  }

  const handleInstallApp = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    setInstallEvent(null)
  }

  const handleCustomerLogout = () => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    window.location.href = '/customer-login'
  }

  if (!customerSession) {
    return <Navigate to="/customer-login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card p-6">
          <h1 className="text-2xl font-black">حجز صيانة</h1>
          <p className="text-slate-400 text-sm mt-2">احجز مكان صيانة (3 أماكن فقط يوميًا) وادفع عربون 50 جنيه لتأكيد الحجز.</p>
          <p className="text-slate-400 text-sm mt-1">لينك الحجز المباشر: <a href={BOOKING_PAGE_URL} target="_blank" rel="noreferrer" className="text-primary-400">{BOOKING_PAGE_URL}</a></p>
          <p className="text-slate-300 mt-2">رقم الشكاوى: <a href={`tel:${COMPLAINTS_PHONE}`} className="text-primary-400">{COMPLAINTS_PHONE}</a></p>
          <button type="button" onClick={handleCustomerLogout} className="btn-ghost mt-3">تبديل حساب العميل</button>
          {installEvent && (
            <button type="button" onClick={handleInstallApp} className="btn-primary mt-4">
              تثبيت تطبيق الحجز على الموبايل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <input className="input" placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className="input" placeholder="موديل العربية" value={form.carModel} onChange={(e) => setForm({ ...form, carModel: e.target.value })} />
          <input className="input" type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} required />
          <select className="input" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} required>
            {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <textarea className="input min-h-24" placeholder="مشكلة السيارة / ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" className="btn-primary w-full" disabled={loading || availableSlots.length === 0}>
            {loading ? 'جارٍ الحجز...' : 'تأكيد الحجز'}
          </button>
        </form>

        {bookingId && (
          <div className="card p-6 space-y-4">
            <p className="text-emerald-400 font-bold">تم استلام طلبك. كود الحجز: {bookingId.slice(-6).toUpperCase()}</p>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-2">
              <p className="font-bold text-amber-300">بيانات الدفع (InstaPay / المحافظ)</p>
              <p className="text-sm text-slate-200">الرقم: <span className="font-black">{PAYMENT_NUMBER}</span></p>
              <p className="text-sm text-slate-200">المبلغ المطلوب: <span className="font-black">50 جنيه</span></p>
              <p className="text-xs text-slate-400">بعد التحويل، ابعت رسالة في الشات فيها "تم الدفع" وآخر 4 أرقام من رقمك وصورة التحويل.</p>
            </div>
            <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" className="btn-primary inline-flex">فتح رابط الدفع السريع</a>
            <a href={`tel:${PAYMENT_NUMBER}`} className="btn-ghost inline-flex">اتصال برقم الدفع</a>
            <div className="border border-white/10 rounded-xl p-4">
              <h2 className="font-bold mb-3">شات مع الإدارة</h2>
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
            <Link to="/" className="text-primary-400 text-sm">العودة للمتجر</Link>
          </div>
        )}
      </div>
    </div>
  )
}
