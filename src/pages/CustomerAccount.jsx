import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowUpLeft,
  CalendarCheck2,
  History,
  MapPin,
  Navigation,
  ShieldAlert,
  Sparkles,
  Wallet,
  Wrench,
} from 'lucide-react'
import { auth } from '../firebase/config'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import {
  getCustomerAccountStatusLabel,
  isCustomerAccountRestricted,
} from '../utils/customerAccounts'
import { normalizeCustomerPhone } from '../utils/customerAuth'

const SERVICE_WHATSAPP = '201127930685'

function getWalletFromCollection(customerWallets, uid) {
  return customerWallets.find((wallet) => wallet.uid === uid || wallet.id === uid) || null
}

function getAccountFromCollection(customerAccounts, uid, phone) {
  const normalizedPhone = normalizeCustomerPhone(phone)

  return (
    customerAccounts.find((account) => {
      const sameUid = account.uid === uid || account.id === uid
      const samePhone =
        normalizedPhone && normalizeCustomerPhone(account.phone) === normalizedPhone

      return sameUid || samePhone
    }) || null
  )
}

function FeatureStep({ number, title, body }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
        {number}
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
      </div>
    </div>
  )
}

export default function CustomerAccount() {
  const navigate = useNavigate()
  const { customerWallets, customerAccounts } = useStore()
  const { currentUser } = useAuth()
  const [sendingLocation, setSendingLocation] = useState(false)

  const wallet = useMemo(() => {
    if (!currentUser?.uid) return null
    return getWalletFromCollection(customerWallets, currentUser.uid)
  }, [currentUser?.uid, customerWallets])

  const customerAccount = useMemo(() => {
    if (!currentUser?.uid && !currentUser?.phone) return null
    return getAccountFromCollection(customerAccounts, currentUser?.uid, currentUser?.phone)
  }, [currentUser?.phone, currentUser?.uid, customerAccounts])

  // UX: اكتشاف الحجز النشط لعرضه في المقدمة
  const { serviceBookings } = useStore()
  const activeBooking = useMemo(() => {
    return serviceBookings.find(b => 
      (b.customerAuthUid === currentUser?.uid || normalizeCustomerPhone(b.phone) === normalizeCustomerPhone(currentUser?.phone)) &&
      ['new', 'confirmed'].includes(b.status)
    )
  }, [serviceBookings, currentUser])

  if (!currentUser) {
    return <Navigate to="/customer/login" replace />
  }

  const logout = async () => {
    await auth.signOut()
    navigate('/customer/login')
  }

  const sendLocationMessage = async () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع')
      return
    }

    setSendingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`
        const text = `مرحبًا، أحتاج خدمة خارجية وموقعي الحالي هو: ${mapUrl}`
        window.open(
          `https://wa.me/${SERVICE_WHATSAPP}?text=${encodeURIComponent(text)}`,
          '_blank'
        )
        setSendingLocation(false)
      },
      () => {
        toast.error('تعذر الوصول إلى الموقع. تأكد من تشغيل GPS')
        setSendingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const displayName = currentUser?.name || 'عميلنا'
  const phoneNumber = currentUser?.phone || customerAccount?.phone || ''
  const normalizedPhone = normalizeCustomerPhone(phoneNumber)
  const hasCustomerPhone = normalizedPhone.length >= 10
  const portalHref = hasCustomerPhone ? `/portal/${normalizedPhone}` : '/customer/account'
  const walletBalance = Number(wallet?.balance || 0).toLocaleString('en-US')
  const reviewStatusLabel = getCustomerAccountStatusLabel(customerAccount?.status)
  const reviewReason =
    customerAccount?.reviewReason || currentUser?.phoneVerificationReason || ''
  const isAccountRestricted = isCustomerAccountRestricted(
    currentUser?.phoneVerificationStatus,
    customerAccount?.status
  )
  const hasPendingReview =
    !isAccountRestricted &&
    (currentUser?.phoneVerificationStatus === 'pending' ||
      customerAccount?.status === 'pending_phone_verification')

  const whatsappText = encodeURIComponent(
    `مرحبًا، أحتاج مراجعة أو تحديث بيانات حساب العميل المرتبط بالرقم ${phoneNumber || '-'}`
  )

  if (isAccountRestricted) {
    return (
      <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
        <div className="customer-grid" />
        <div className="customer-noise" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="customer-panel-dark w-full overflow-hidden p-6 sm:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="customer-chip">
                    <ShieldAlert size={12} />
                    مراجعة مطلوبة
                  </div>
                  <div className="customer-chip">
                    <Sparkles size={12} />
                    {reviewStatusLabel}
                  </div>
                </div>

                <div>
                  <p className="customer-kicker">ELFAROUK CUSTOMER ACCOUNT</p>
                  <h1 className="customer-title mt-3 text-3xl leading-tight sm:text-5xl">
                    الحساب يحتاج
                    <br />
                    متابعة من الإدارة
                  </h1>
                  <p className="customer-subtitle mt-4 max-w-2xl text-base leading-8">
                    الحساب غير متاح حاليًا على هذا الرقم. راجع الملاحظة التالية أو تواصل معنا
                    لتحديث البيانات، وبعدها نكمل لك الخدمة من نفس الصفحة.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="customer-card-soft">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                      رقم الهاتف
                    </p>
                    <p className="mt-3 text-2xl font-black text-white" dir="ltr">
                      {phoneNumber || '-'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      هذا هو الرقم الحالي المرتبط بالحساب.
                    </p>
                  </div>

                  <div className="customer-card-soft">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                      الحالة
                    </p>
                    <p className="mt-3 text-2xl font-black text-amber-300">{reviewStatusLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      لو احتجت تحديث الرقم أو تفعيل الحساب سنساعدك من نفس المحادثة.
                    </p>
                  </div>
                </div>

                {reviewReason && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                    {reviewReason}
                  </div>
                )}
              </div>

              <div className="customer-card-soft p-0">
                <div className="rounded-[1.5rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                        الخطوة التالية
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">نرجّع الحساب بسرعة</h2>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-primary-100">
                      <ShieldAlert size={18} />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <FeatureStep
                      number="1"
                      title="راجع الرقم"
                      body="تأكد أن رقم الهاتف الحالي هو الرقم الذي تريد ربط كل صفحات العميل به."
                    />
                    <FeatureStep
                      number="2"
                      title="أرسل الملاحظة"
                      body="لو الرقم يحتاج تعديل أو الحساب مرفوض بالخطأ، ابعت لنا مباشرة من الزر التالي."
                    />
                    <FeatureStep
                      number="3"
                      title="ارجع للحساب"
                      body="بمجرد تحديث الحالة ستقدر تكمّل الحجز والمتابعة من نفس المكان."
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href={`https://wa.me/${SERVICE_WHATSAPP}?text=${whatsappText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary justify-center rounded-2xl"
                    >
                      تواصل مع الإدارة
                    </a>
                    <button type="button" onClick={logout} className="btn-ghost rounded-2xl">
                      تسجيل خروج
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    )
  }

  const quickActions = [
    {
      as: Link,
      to: '/service-booking',
      icon: CalendarCheck2,
      title: 'احجز صيانة',
      body: 'افتح صفحة الحجز وحدد اليوم والمكان، وسيب المتابعة كلها على نفس الرقم.',
      accent: 'from-primary-700 to-primary-500',
      iconClass: 'bg-primary-50 text-primary-700',
      badge: 'الحجز',
    },
    {
      as: Link,
      to: portalHref,
      icon: History,
      title: 'سجل العميل',
      body: 'شاهد الفواتير وسجل الصيانة المرتبطين بنفس رقم الهاتف.',
      accent: 'from-violet-600 to-indigo-500',
      iconClass: 'bg-violet-50 text-violet-700',
      badge: 'السجل',
    },
    {
      as: 'button',
      onClick: sendLocationMessage,
      icon: MapPin,
      title: sendingLocation ? 'جاري تحديد موقعك...' : 'اطلب خدمة خارجية',
      body: 'أرسل موقعك الحالي مباشرة لو تحتاج الخدمة في مكانك بدل الفرع.',
      accent: 'from-emerald-600 to-teal-500',
      iconClass: 'bg-emerald-50 text-emerald-700',
      badge: 'الموقع',
      disabled: sendingLocation,
    },
    {
      as: 'a',
      href: 'https://maps.google.com',
      target: '_blank',
      rel: 'noreferrer',
      icon: Navigation,
      title: 'افتح الخرائط',
      body: 'زور الفرع أو شارك اللوكيشن مع أي شخص من هنا بسرعة.',
      accent: 'from-amber-600 to-orange-500',
      iconClass: 'bg-amber-50 text-amber-700',
      badge: 'الفرع',
    },
  ]

  return (
    <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <div className="customer-grid" />
      <div className="customer-noise" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="customer-panel-dark overflow-hidden p-6 sm:p-8 xl:p-10"
        >
          <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
            {/* عرض حالة الصيانة الحالية فوراً (UX Prompt) */}
            {activeBooking && (
              <div className="col-span-full mb-6">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-primary-500/10 border border-primary-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 text-right">
                    <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-neon animate-pulse">
                      <Wrench size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg">سيارتك قيد المتابعة الآن</h3>
                      <p className="text-primary-200 text-xs font-bold mt-1">
                        حالة الحجز: {activeBooking.status === 'confirmed' ? 'تم التأكيد - في انتظارك' : 'طلب جديد بانتظار المراجعة'}
                      </p>
                    </div>
                  </div>
                  <Link to="/service-booking" className="btn-primary !py-3 !px-8 rounded-xl shadow-lg">
                    تابع التفاصيل
                  </Link>
                </motion.div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="customer-chip">
                  <Sparkles size={12} />
                  Customer Hub
                </div>
                <div className="customer-chip">
                  <Wrench size={12} />
                  كل شيء على رقمك
                </div>
              </div>

              <div>
                <p className="customer-kicker">ELFAROUK CUSTOMER ACCOUNT</p>
                <h1 className="customer-title mt-3 text-3xl sm:text-5xl">أهلًا يا {displayName}</h1>
                <p className="customer-subtitle mt-4 max-w-2xl text-base leading-8">
                  من هنا تقدر تحجز وتتابع السجل والخدمة الخارجية على نفس رقم الهاتف، من غير
                  لف ولا صفحات معلقة.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    المحفظة
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-3xl font-black text-white">
                    <Wallet size={20} className="text-primary-200" />
                    {walletBalance}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    رصيد المحفظة الحالي بالجنيه المصري.
                  </p>
                </div>

                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    رقم الهاتف
                  </p>
                  <p className="mt-3 text-2xl font-black text-white" dir="ltr">
                    {phoneNumber || '-'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    هذا هو الرقم الذي يربط الحساب والحجز والبوابة معًا.
                  </p>
                </div>

                <div className="customer-card-soft">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                    الحالة
                  </p>
                  <p className="mt-3 text-2xl font-black text-emerald-300">
                    {hasPendingReview ? 'شغال بالرقم' : 'جاهز'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    صفحات العميل تعمل الآن على رقم الهاتف نفسه، وأي تحديث إداري سيظهر هنا.
                  </p>
                </div>
              </div>

              {hasPendingReview && (
                <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
                  الحساب يعمل حاليًا على رقم الهاتف، حتى لو كانت هناك مراجعة داخلية مستمرة.
                  {reviewReason ? ` ملاحظة الإدارة: ${reviewReason}` : ''}
                </div>
              )}
            </div>

            <div className="customer-card-soft p-0">
              <div className="rounded-[1.5rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                      البداية السريعة
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">ابدأ من الرقم</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-primary-100">
                    <Sparkles size={18} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <FeatureStep
                    number="1"
                    title="افتح الحجز"
                    body="اختَر اليوم والمكان المناسبين وسيُربط الطلب بنفس رقم الحساب."
                  />
                  <FeatureStep
                    number="2"
                    title="افتح سجل العميل"
                    body="راجع الفواتير وسجل الصيانة من البوابة الخاصة برقمك."
                  />
                  <FeatureStep
                    number="3"
                    title="اطلب الخدمة الخارجية"
                    body="لو تحتاج خدمة في مكانك، أرسل موقعك مباشرة من داخل الحساب."
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link to={portalHref} className="btn-primary justify-center rounded-2xl">
                    افتح بوابة رقم الهاتف
                  </Link>
                  <button type="button" onClick={logout} className="btn-ghost rounded-2xl">
                    تسجيل خروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const sharedProps = {
              className: 'customer-panel customer-card-light block overflow-hidden p-0 text-right',
            }

            const content = (
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className={`rounded-[1.2rem] p-3 ${action.iconClass}`}>
                    <Icon size={20} />
                  </div>
                  <div
                    className={`rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-black text-white ${action.accent}`}
                  >
                    {action.badge}
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-black text-slate-950">{action.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">{action.body}</p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary-700">
                  افتح الآن
                  <ArrowUpLeft size={15} />
                </div>
              </div>
            )

            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.06, duration: 0.35 }}
              >
                {action.as === Link ? (
                  <Link to={action.to} {...sharedProps}>
                    {content}
                  </Link>
                ) : action.as === 'a' ? (
                  <a href={action.href} target={action.target} rel={action.rel} {...sharedProps}>
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    {...sharedProps}
                  >
                    {content}
                  </button>
                )}
              </motion.div>
            )
          })}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
          className="customer-panel p-5 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr,auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                الدعم والبوابة
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                رقم الهاتف هو مفتاح حسابك كله
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                لو احتجت تعديل الرقم أو أردت فتح السجل مباشرة، كل ده متاح من نفس الحساب
                بدون خطوات كثيرة أو صفحات انتظار.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={portalHref} className="btn-ghost inline-flex items-center gap-2">
                <History size={15} />
                سجل الهاتف
              </Link>
              <button type="button" onClick={logout} className="btn-primary rounded-2xl px-6">
                تسجيل خروج
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
