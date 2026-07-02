import { useEffect, useMemo, useState } from 'react'
/* eslint-disable no-unreachable */
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ImagePlus,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { auth } from '../firebase/config'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { fetchServiceSlotAvailability, isBookingStatusActive } from '../services/serviceBookingApi'
import {
  getCustomerAccountStatusLabel,
  isCustomerAccountRestricted,
} from '../utils/customerAccounts'
import { normalizeCustomerPhone } from '../utils/customerAuth'
import {
  SERVICE_PAYMENT_STATUSES,
  canCustomerSubmitPaymentProof,
  getServicePaymentStatusLabel,
} from '../utils/serviceBooking'

const PAYMENT_LINK = 'https://ipn.eg/01115329887'
const PAYMENT_NUMBER = '01115329887'
const COMPLAINTS_PHONE = '01127930685'
const INSTAPAY_LINK = PAYMENT_LINK
const WALLET_LINK = `https://wa.me/2${PAYMENT_NUMBER}?text=${encodeURIComponent('مساء الخير، عايز أحول عربون الصيانة 50 جنيه على المحفظة')}`
const LIVE_SITE_URL = 'https://elfarouk-store.vercel.app'
const BOOKING_PAGE_URL = `${LIVE_SITE_URL}/service-booking`
const SERVICE_SLOTS = ['المكان 1', 'المكان 2', 'المكان 3']

function sortByCreatedAtAsc(items) {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
    const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
    return aDate - bDate
  })
}

function getStatusLabel(status) {
  const labels = {
    new: 'جديد',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }
  return labels[status] || 'قيد المراجعة'
}

function getPaymentLabel(status) {
  return getServicePaymentStatusLabel(status)
  const labels = {
    pending: 'في انتظار الدفع',
    paid: 'تم الدفع',
    failed: 'فشل الدفع',
  }
  return labels[status] || 'في انتظار الدفع'
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('تعذر تجهيز الصورة'))
    image.src = dataUrl
  })
}

async function compressPaymentProof(file) {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const maxWidth = 1280
  const scale = Math.min(1, maxWidth / image.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('تعذر تجهيز الصورة')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.72)
}

function getMessagePaymentMeta(message) {
  return {
    senderPhone: message.paymentSenderPhone || '',
    proofImage: message.paymentProofImage || '',
    proofFileName: message.paymentProofFileName || '',
  }
}

function MessageBubble({ message }) {
  const isAdmin = message.sender === 'admin'
  const isSystem = message.sender === 'system'
  const paymentMeta = getMessagePaymentMeta(message)
  const hasPaymentProof = Boolean(paymentMeta.senderPhone || paymentMeta.proofImage)

  return (
    <div
      className={`rounded-[1.3rem] p-4 text-sm ${
        isSystem
          ? 'bg-amber-50 text-amber-900'
          : isAdmin
            ? 'mr-8 bg-primary-50 text-slate-900'
            : 'ml-8 bg-slate-100 text-slate-900'
      }`}
    >
      <p className="mb-1 font-black">{isAdmin ? 'الإدارة' : isSystem ? 'النظام' : 'أنت'}</p>
      <p className="leading-6">{message.text}</p>

      {hasPaymentProof && (
        <div className="mt-3 space-y-2 rounded-2xl border border-black/5 bg-white/70 p-3">
          {paymentMeta.senderPhone && (
            <p className="text-xs font-black text-slate-700" dir="ltr">
              From: {paymentMeta.senderPhone}
            </p>
          )}
          {paymentMeta.proofImage && (
            <a href={paymentMeta.proofImage} target="_blank" rel="noreferrer" className="block">
              <img
                src={paymentMeta.proofImage}
                alt={paymentMeta.proofFileName || 'Payment proof'}
                className="max-h-60 w-full rounded-xl object-contain"
              />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function ServiceBooking() {
  const {
    serviceBookings,
    serviceMessages,
    notifications,
    customerAccounts,
    addServiceBooking,
    addServiceMessage,
    updateServiceBooking,
    markNotificationAsRead,
  } = useStore()
  const { currentUser, loading: authLoading } = useAuth()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    carModel: '',
    notes: '',
    slot: SERVICE_SLOTS[0],
    day: '',
  })
  const [bookingId, setBookingId] = useState('')
  const [reservedSlots, setReservedSlots] = useState([])
  const [chatText, setChatText] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentSenderPhone, setPaymentSenderPhone] = useState('')
  const [paymentProofImage, setPaymentProofImage] = useState('')
  const [paymentProofFileName, setPaymentProofFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    if (!currentUser) return

    setForm((prev) => ({
      ...prev,
      name: prev.name || currentUser.name || '',
      phone: prev.phone || currentUser.phone || '',
    }))
  }, [currentUser])

  useEffect(() => {
    let cancelled = false

    if (!form.day) {
      setReservedSlots([])
      return () => {
        cancelled = true
      }
    }

    fetchServiceSlotAvailability(form.day)
      .then((data) => {
        if (!cancelled) {
          setReservedSlots(data.reservedSlots || [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReservedSlots([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [form.day])

  useEffect(() => {
    setForm((prev) => {
      if (!prev.day) return prev
      if (!reservedSlots.includes(prev.slot)) return prev

      const nextAvailable = SERVICE_SLOTS.find((slot) => !reservedSlots.includes(slot))
      return {
        ...prev,
        slot: nextAvailable || prev.slot,
      }
    })
  }, [reservedSlots])

  const activeBooking = useMemo(
    () => serviceBookings.find((booking) => isBookingStatusActive(booking.status)) || null,
    [serviceBookings]
  )

  const customerPhone = normalizeCustomerPhone(currentUser?.phone || '')

  const customerAccount = useMemo(() => {
    if (!currentUser?.uid && !customerPhone) return null

    return (
      customerAccounts.find((account) => {
        const sameUid = account.uid === currentUser?.uid || account.id === currentUser?.uid
        const samePhone = customerPhone && normalizeCustomerPhone(account.phone) === customerPhone
        return sameUid || samePhone
      }) || null
    )
  }, [customerAccounts, currentUser?.uid, customerPhone])

  const accountPhone = normalizeCustomerPhone(currentUser?.phone || customerAccount?.phone || form.phone)
  const hasAccountPhone = accountPhone.length >= 10
  const portalHref = hasAccountPhone ? `/portal/${accountPhone}` : '/customer/account'
  const phoneFieldLocked = normalizeCustomerPhone(currentUser?.phone).length >= 10
  const isAccountRestricted = isCustomerAccountRestricted(
    currentUser?.phoneVerificationStatus,
    customerAccount?.status
  )
  const reviewStatusLabel = getCustomerAccountStatusLabel(customerAccount?.status)
  const reviewReason =
    customerAccount?.reviewReason || currentUser?.phoneVerificationReason || ''
  const hasPendingReview =
    !isAccountRestricted &&
    (currentUser?.phoneVerificationStatus === 'pending' ||
      customerAccount?.status === 'pending_phone_verification')

  useEffect(() => {
    if (activeBooking?.id) {
      setBookingId(activeBooking.id)
    } else {
      setBookingId('')
    }
  }, [activeBooking?.id])

  const availableSlots = SERVICE_SLOTS.filter((slot) => !reservedSlots.includes(slot))

  const bookingMessages = useMemo(() => {
    if (!bookingId) return []
    return sortByCreatedAtAsc(serviceMessages.filter((message) => message.bookingId === bookingId))
  }, [serviceMessages, bookingId])

  const myNotifications = useMemo(() => {
    if (!bookingId) return []
    return notifications.filter(
      (notification) => notification.audience === 'customer' && notification.bookingId === bookingId
    )
  }, [notifications, bookingId])

  const canSubmitPaymentProof = canCustomerSubmitPaymentProof(activeBooking?.paymentStatus)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (activeBooking) {
      toast('يوجد حجز نشط بالفعل على حسابك')
      return
    }

    setLoading(true)
    try {
      const result = await addServiceBooking({
        ...form,
        paymentLink: PAYMENT_LINK,
      })

      setBookingId(result.id)

      if (result.alreadyExists) {
        toast('يوجد حجز نشط بالفعل على حسابك')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!bookingId || !chatText.trim() || !currentUser?.uid) return

    await updateServiceBooking(bookingId, {
      paymentStatus: SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED,
      paymentSubmittedAt: new Date().toISOString(),
    })

    await addServiceMessage({
      bookingId,
      sender: 'customer',
      customerAuthUid: currentUser.uid,
      text: chatText.trim(),
    })
    setChatText('')
  }

  const handlePaymentProofChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('ارفع صورة فقط')
      event.target.value = ''
      return
    }

    setLoading(true)
    try {
      const compressed = await compressPaymentProof(file)
      if (compressed.length > 850000) {
        throw new Error('الصورة كبيرة، حاول لقطة أوضح وأخف')
      }
      setPaymentProofImage(compressed)
      setPaymentProofFileName(file.name)
      toast.success('تم تجهيز لقطة التحويل')
    } catch (error) {
      toast.error(error.message || 'تعذر تجهيز الصورة')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const handlePaymentSubmitted = async () => {
    if (!bookingId || !currentUser?.uid) return
    if (!canSubmitPaymentProof) {
      toast('إثبات الدفع الحالي بانتظار مراجعة الإدارة')
      return
    }

    const normalizedSenderPhone = normalizeCustomerPhone(paymentSenderPhone)
    if (normalizedSenderPhone.length < 10) {
      toast.error('اكتب الرقم الذي تم التحويل منه')
      return
    }

    if (!paymentProofImage) {
      toast.error('ارفع لقطة التحويل أولًا')
      return
    }

    await addServiceMessage({
      bookingId,
      sender: 'customer',
      customerAuthUid: currentUser.uid,
      text: `تم إرسال تحويل عربون 50 جنيه.${paymentNote ? ` ملاحظات: ${paymentNote}` : ''}`,
      paymentSenderPhone: normalizedSenderPhone,
      paymentProofImage,
      paymentProofFileName,
    })

    setPaymentNote('')
    setPaymentSenderPhone('')
    setPaymentProofImage('')
    setPaymentProofFileName('')
    toast.success('تم إرسال إثبات الدفع للإدارة')
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

  if (authLoading) {
    return (
      <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
        <div className="customer-grid" />
        <div className="customer-noise" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl items-center justify-center">
          <div className="customer-panel-dark w-full p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-300 border-t-transparent" />
            <p className="mt-5 text-sm font-bold text-slate-200">جارٍ التحقق من حساب العميل...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return <Navigate to="/customer/login?mode=login&redirect=%2Fservice-booking" replace />
  }

  if (isAccountRestricted) {
    return (
      <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
        <div className="customer-grid" />
        <div className="customer-noise" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center">
          <div className="customer-panel-dark w-full p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="customer-chip">
                <ShieldAlert size={12} />
                تفعيل الحساب مطلوب
              </div>
              <div className="customer-chip">
                <Sparkles size={12} />
                {reviewStatusLabel}
              </div>
            </div>

            <p className="customer-kicker mt-6">ELFAROUK BOOKING ACCESS</p>
            <h1 className="customer-title mt-3 text-3xl leading-tight sm:text-5xl">
              الحجز سيفتح بعد
              <br />
              مراجعة رقم الهاتف
            </h1>
            <p className="customer-subtitle mt-4 max-w-2xl text-base">
              سجلت الحساب بنجاح، لكن صفحة الحجز ستظل مقفولة لحد ما الإدارة تتأكد من صاحب
              الرقم ثم تفعّل الحساب.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="customer-card-soft">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                  رقم الهاتف
                </p>
                <p className="mt-3 text-2xl font-black text-white" dir="ltr">
                  {currentUser?.phone || customerAccount?.phone || '-'}
                </p>
                <p className="mt-2 text-sm text-slate-300">هذا الرقم هو الذي ستتم مراجعته.</p>
              </div>

              <div className="customer-card-soft">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                  الحالة
                </p>
                <p className="mt-3 text-2xl font-black text-amber-300">{reviewStatusLabel}</p>
                <p className="mt-2 text-sm text-slate-300">بعد الموافقة سيتفعل الحجز تلقائيًا.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/customer/account" className="btn-primary justify-center rounded-2xl">
                الرجوع إلى حسابي
              </Link>
              <button type="button" onClick={handleCustomerLogout} className="btn-ghost rounded-2xl">
                تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <div className="customer-grid" />
      <div className="customer-noise" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="customer-panel-dark overflow-hidden p-6 sm:p-8 xl:p-10"
        >
          <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr] xl:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="customer-chip">
                  <Sparkles size={12} />
                  Booking Lounge
                </div>
                <div className="customer-chip">
                  <ShieldCheck size={12} />
                  حجز آمن ومؤكد
                </div>
                <div className="customer-chip">
                  <CreditCard size={12} />
                  عربون 50 جنيه
                </div>
              </div>

              <div>
                <p className="customer-kicker">ELFAROUK BOOKING EXPERIENCE</p>
                <h1 className="customer-title mt-3 text-3xl leading-tight sm:text-5xl">
                  احجز الصيانة
                  <br />
                  بشكل منظم
                </h1>
                <p className="customer-subtitle mt-4 max-w-2xl text-base">
                  اختَر موعدك، ثم أرسل إثبات التحويل من نفس الصفحة مع رقم الهاتف الذي حولت
                  منه، وستراجع الإدارة الطلب من داخل النظام.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    Availability
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">3</p>
                  <p className="mt-2 text-sm text-slate-300">أماكن متاحة يوميًا للحجز المسبق.</p>
                </div>
                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    Status
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">
                    {activeBooking ? getStatusLabel(activeBooking.status) : 'جاهز للحجز'}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">الحالة الحالية للحجز النشط.</p>
                </div>
                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    Link
                  </p>
                  <p className="mt-3 truncate text-base font-black text-white">{BOOKING_PAGE_URL}</p>
                  <p className="mt-2 text-sm text-slate-300">رابط مباشر للحجز من أي جهاز.</p>
                </div>
              </div>
              {hasPendingReview && (
                <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
                  الحساب يعمل على رقم الهاتف الآن، وحتى لو كانت هناك مراجعة داخلية سيظل الحجز
                  والمتابعة مفتوحين على نفس الرقم.
                  {reviewReason ? ` ملاحظة الإدارة: ${reviewReason}` : ''}
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="customer-card-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-100/70">
                    Quick Access
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">كل شيء في مكان واحد</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-primary-100">
                  <Wrench size={20} />
                </div>
              </div>

              <div className="customer-divider my-5" />

              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  رقم الشكاوى: <span className="font-black text-white">{COMPLAINTS_PHONE}</span>
                </p>
                <p>
                  رقم الدفع: <span className="font-black text-white">{PAYMENT_NUMBER}</span>
                </p>
                <p>
                  الرابط المباشر: <span className="font-black text-white">/service-booking</span>
                </p>
                {hasAccountPhone && (
                  <p>
                    بوابة الرقم: <span className="font-black text-white">{portalHref}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {hasAccountPhone && (
                  <Link to={portalHref} className="btn-primary">
                    سجل رقم الهاتف
                  </Link>
                )}
                <Link to="/customer/account" className="btn-ghost">
                  الذهاب إلى حسابي
                </Link>
                <button type="button" onClick={handleCustomerLogout} className="btn-ghost">
                  تبديل حساب العميل
                </button>
                {installEvent && (
                  <button type="button" onClick={handleInstallApp} className="btn-primary">
                    تثبيت التطبيق
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <motion.form
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            onSubmit={handleSubmit}
            className="customer-panel p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                  Booking Form
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">بيانات الحجز</h2>
              </div>
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                <CalendarDays size={20} />
              </div>
            </div>

            {activeBooking && (
              <div className="mt-5 rounded-[1.4rem] border border-primary-200 bg-primary-50 px-4 py-4 text-sm font-semibold text-primary-800">
                يوجد حجز نشط بالفعل على حسابك. تقدر تتابعه من نفس الصفحة أو من حساب العميل.
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                className={`input h-14 rounded-2xl border-slate-200 ${
                  phoneFieldLocked ? 'bg-slate-50 text-slate-600' : ''
                }`}
                placeholder="الاسم"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <input
                className="input h-14 rounded-2xl border-slate-200"
                placeholder="رقم الهاتف"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: normalizeCustomerPhone(event.target.value) })
                }
                dir="ltr"
                inputMode="numeric"
                readOnly={phoneFieldLocked}
                required
              />
            </div>

            {phoneFieldLocked && (
              <p className="mt-3 text-xs font-bold text-slate-500">
                الحجز مربوط بنفس رقم الهاتف المسجل حتى تظهر المتابعة والبوابة على نفس الحساب.
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="input h-14 rounded-2xl border-slate-200"
                placeholder="موديل العربية"
                value={form.carModel}
                onChange={(event) => setForm({ ...form, carModel: event.target.value })}
              />
              <input
                className="input h-14 rounded-2xl border-slate-200"
                type="date"
                value={form.day}
                onChange={(event) => setForm({ ...form, day: event.target.value })}
                required
              />
            </div>

            <div className="mt-5">
              <p className="text-sm font-black text-slate-900">اختر المكان المناسب</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {SERVICE_SLOTS.map((slot) => {
                  const reserved = reservedSlots.includes(slot)
                  const selected = form.slot === slot

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={reserved}
                      onClick={() => setForm({ ...form, slot })}
                      className={`rounded-[1.4rem] border px-4 py-4 text-right transition-all ${
                        reserved
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : selected
                            ? 'border-primary-300 bg-primary-50 shadow-[0_14px_34px_rgba(34,92,151,0.1)]'
                            : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/40'
                      }`}
                    >
                      <p className="text-sm font-black text-slate-900">{slot}</p>
                      <p className={`mt-2 text-xs font-semibold ${reserved ? 'text-slate-400' : 'text-slate-500'}`}>
                        {reserved ? 'محجوز' : selected ? 'الموعد المختار' : 'متاح الآن'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {form.day && availableSlots.length === 0 && (
              <p className="mt-4 text-sm font-semibold text-amber-700">
                لا توجد مواعيد متاحة في هذا اليوم حاليًا.
              </p>
            )}

            <textarea
              className="input mt-5 min-h-28 rounded-2xl border-slate-200"
              placeholder="وصف المشكلة / الملاحظات"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="btn-primary mt-5 w-full rounded-2xl py-4"
              disabled={loading || !!activeBooking || (form.day && availableSlots.length === 0)}
            >
              {loading ? 'جارٍ الحجز...' : 'تأكيد الحجز'}
            </motion.button>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="space-y-4"
          >
            <div className="customer-panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                    Payment Steps
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">تعليمات العربون</h2>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <ClipboardCheck size={18} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="customer-card-light">
                  <p className="text-xs font-black text-slate-500">الرقم</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{PAYMENT_NUMBER}</p>
                </div>
                <div className="customer-card-light">
                  <p className="text-xs font-black text-slate-500">المبلغ المطلوب</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">50 جنيه</p>
                </div>
                <div className="customer-card-light">
                  <p className="text-sm leading-7 text-slate-500">
                    بعد التحويل اكتب الرقم الذي تم التحويل منه، وارفع لقطة التحويل، ولو عندك
                    رقم عملية أو ملاحظة اكتبها أيضًا.
                  </p>
                </div>
              </div>
            </div>

            <div className="customer-panel-dark p-5 sm:p-6">
              <p className="customer-kicker">Direct Actions</p>
              <h2 className="mt-3 text-2xl font-black text-white">نفّذ الخطوة التالية فورًا</h2>
              <div className="mt-5 grid gap-3">
                <a
                  href={INSTAPAY_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary justify-center rounded-2xl py-3.5"
                >
                  الدفع عبر InstaPay
                </a>
                <a
                  href={WALLET_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3.5 text-center text-sm font-black text-white transition-all hover:bg-white/14"
                >
                  الدفع عبر المحفظة
                </a>
                <button
                  type="button"
                  onClick={copyPaymentNumber}
                  className="rounded-2xl border border-white/10 bg-transparent px-5 py-3.5 text-sm font-black text-slate-200 transition-all hover:border-primary-200 hover:text-white"
                >
                  نسخ رقم الدفع
                </button>
              </div>
            </div>
          </motion.aside>
        </div>

        <AnimatePresence>
          {bookingId && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                <div className="customer-panel-dark p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="customer-kicker">Active Booking</p>
                      <h2 className="mt-2 text-2xl font-black text-white">تم استلام طلبك</h2>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="customer-card-soft">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-100/70">
                        Code
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">
                        {bookingId.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="customer-card-soft">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-100/70">
                        Status
                      </p>
                      <p className="mt-3 text-xl font-black text-white">
                        {getStatusLabel(activeBooking?.status)}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {getPaymentLabel(activeBooking?.paymentStatus)}
                      </p>
                    </div>
                  </div>

                  {activeBooking && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="customer-card-soft">
                        <p className="text-xs font-black text-slate-300">اليوم</p>
                        <p className="mt-2 text-lg font-black text-white">{activeBooking.day || '-'}</p>
                      </div>
                      <div className="customer-card-soft">
                        <p className="text-xs font-black text-slate-300">المكان</p>
                        <p className="mt-2 text-lg font-black text-white">{activeBooking.slot || '-'}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 rounded-[1.4rem] border border-primary-500/20 bg-primary-500/8 p-4">
                    <p className="text-sm font-bold text-primary-100">تأكيد التحويل</p>
                    {activeBooking?.paymentReviewNote && (
                      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                        {activeBooking.paymentReviewNote}
                      </div>
                    )}
                    <input
                      className="input mt-3 rounded-2xl border-white/10 bg-white/95"
                      placeholder="اكتب الرقم الذي تم التحويل منه"
                      value={paymentSenderPhone}
                      onChange={(event) => setPaymentSenderPhone(normalizeCustomerPhone(event.target.value))}
                      inputMode="numeric"
                      disabled={!canSubmitPaymentProof}
                    />
                    <input
                      className="input mt-3 rounded-2xl border-white/10 bg-white/95"
                      placeholder="اكتب ملاحظة الدفع أو رقم العملية"
                      value={paymentNote}
                      onChange={(event) => setPaymentNote(event.target.value)}
                      disabled={!canSubmitPaymentProof}
                    />
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white transition-all hover:bg-white/14">
                      <ImagePlus size={17} />
                      {paymentProofFileName || 'ارفع لقطة التحويل'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePaymentProofChange}
                        disabled={!canSubmitPaymentProof}
                      />
                    </label>
                    {paymentProofImage && (
                      <img
                        src={paymentProofImage}
                        alt="لقطة التحويل"
                        className="mt-3 max-h-56 w-full rounded-2xl object-contain ring-1 ring-white/10"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handlePaymentSubmitted}
                      className="btn-primary mt-3 w-full rounded-2xl"
                      disabled={!canSubmitPaymentProof}
                    >
                      تم التحويل - أرسل إثبات الدفع
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="customer-panel p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                          Notifications
                        </p>
                        <h2 className="mt-2 text-xl font-black text-slate-950">الإشعارات</h2>
                      </div>
                      <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                        <Bell size={18} />
                      </div>
                    </div>

                    {myNotifications.length === 0 ? (
                      <p className="mt-5 text-sm text-slate-500">لا توجد إشعارات جديدة</p>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {myNotifications.slice(0, 5).map((notification, index) => (
                          <motion.button
                            key={notification.id}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            type="button"
                            className={`w-full rounded-[1.3rem] border p-4 text-right ${
                              notification.read
                                ? 'border-slate-200 bg-slate-50'
                                : 'border-primary-200 bg-primary-50'
                            }`}
                            onClick={() =>
                              !notification.read && markNotificationAsRead(notification.id)
                            }
                          >
                            <p className="text-sm font-black text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{notification.body}</p>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="customer-panel p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                          Live Chat
                        </p>
                        <h2 className="mt-2 text-xl font-black text-slate-950">شات مع الإدارة</h2>
                      </div>
                      <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                        <MessageCircle size={18} />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      تابع الردود على الحجز والدفع من داخل نفس الحساب.
                    </p>

                    <div className="mt-5 max-h-72 space-y-3 overflow-auto">
                      {bookingMessages.length === 0 ? (
                        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          لا توجد رسائل بعد. أول رسالة من العميل أو الإدارة ستظهر هنا.
                        </div>
                      ) : (
                        bookingMessages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <MessageBubble message={message} />
                          </motion.div>
                        ))
                      )}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <input
                        className="input flex-1 rounded-2xl"
                        placeholder="اكتب رسالتك"
                        value={chatText}
                        onChange={(event) => setChatText(event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-primary rounded-2xl px-5"
                        onClick={handleSendMessage}
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
