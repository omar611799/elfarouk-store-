import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowUpLeft,
  CheckCircle2,
  Copy,
  LogIn,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wrench,
} from 'lucide-react'

const ENTRY_POINTS = [
  {
    to: '/customer/login?mode=login',
    icon: LogIn,
    title: 'دخول العميل',
    body: 'افتح الحساب الحالي وكمّل الحجز أو المتابعة من نفس المكان.',
    tone: 'primary',
  },
  {
    to: '/customer/login?mode=register',
    icon: UserPlus,
    title: 'تسجيل عميل جديد',
    body: 'أنشئ حساب جديد بسرعة، واربط الحجز والمتابعة والسجل برقم هاتف واحد.',
    tone: 'light',
  },
  {
    to: '/service-booking',
    icon: Wrench,
    title: 'حجز مباشر',
    body: 'لو العميل جاهز، يدخل فورًا على صفحة الحجز والمتابعة والدفع على نفس الرقم.',
    tone: 'dark',
  },
]

const EXPERIENCE_POINTS = [
  'واجهة عامة مرتبة يبدأ منها العميل من غير تشتيت.',
  'رابط واحد تقدر تبعته للعميل ليكمل الرحلة كلها على رقم هاتفه.',
  'QR ونسخ ومشاركة جاهزين، عشان الاستخدام يبقى أسهل على الموبايل.',
]

function getAbsoluteUrl(path) {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export default function Launchpad() {
  const publicUrl = getAbsoluteUrl('/')
  const customerLoginUrl = getAbsoluteUrl('/customer/login')
  const bookingUrl = getAbsoluteUrl('/service-booking')

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`تم نسخ ${label}`)
    } catch (error) {
      console.error(error)
      toast.error('تعذر النسخ من الجهاز الحالي')
    }
  }

  const handleShare = async (value) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ELFAROUK Service',
          text: 'افتح الرابط وسجل دخولك أو احجز الخدمة مباشرة على رقمك.',
          url: value,
        })
        return
      }

      await handleCopy(value, 'الرابط')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        toast.error('تعذر مشاركة الرابط')
      }
    }
  }

  return (
    <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <div className="customer-grid" />
      <div className="customer-noise" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 xl:grid-cols-[1.08fr,0.92fr] xl:gap-8">
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="customer-panel-dark customer-shimmer overflow-hidden p-6 sm:p-8 xl:p-10"
          >
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="customer-chip">
                  <Sparkles size={12} />
                  Public Launchpad
                </div>
                <div className="customer-chip">
                  <ShieldCheck size={12} />
                  Ready To Share
                </div>
              </div>

              <div className="space-y-5">
                <p className="customer-kicker">ELFAROUK SERVICE</p>
                <h1 className="customer-title text-4xl leading-tight sm:text-5xl xl:text-6xl">
                  افتح البرنامج
                  <span className="block text-primary-400">تابع صيانة سيارتك</span>
                  بكل سهولة
                </h1>
                <p className="customer-subtitle max-w-2xl text-base">
                  دي الواجهة العامة الرسمية للنظام: العميل يبدأ منها الدخول أو التسجيل أو
                  الحجز، وكل الرحلة بعد كده تكمّل على رقم الهاتف نفسه بشكل واضح ومنظم.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {EXPERIENCE_POINTS.map((point, index) => (
                  <motion.div
                    key={point}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 + index * 0.08 }}
                    className="customer-card-soft"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-primary-100">
                      <CheckCircle2 size={18} />
                    </div>
                    <p className="text-sm leading-7 text-slate-200">{point}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {ENTRY_POINTS.map(({ to, icon: Icon, title, body, tone }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + index * 0.09 }}
                  >
                    <Link
                      to={to}
                      className={`block rounded-[1.7rem] border p-5 transition-all duration-300 hover:-translate-y-1 ${
                        tone === 'primary'
                          ? 'border-primary-300/30 bg-[linear-gradient(145deg,rgba(21,61,101,0.82)_0%,rgba(34,92,151,0.72)_100%)] text-white shadow-[0_18px_46px_rgba(21,61,101,0.22)]'
                          : tone === 'dark'
                            ? 'border-white/10 bg-white/6 text-white hover:border-primary-200/30'
                            : 'border-white/12 bg-white/92 text-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                            tone === 'light'
                              ? 'bg-primary-50 text-primary-700'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <ArrowUpLeft size={16} className={tone === 'light' ? 'text-primary-700' : 'text-white/80'} />
                      </div>
                      <h2 className="mt-5 text-xl font-black">{title}</h2>
                      <p className={`mt-2 text-sm leading-7 ${tone === 'light' ? 'text-slate-500' : 'text-slate-200'}`}>
                        {body}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="customer-panel overflow-hidden p-5 sm:p-6 xl:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                    Share Ready
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    ابعت الرابط ده للعميل
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    العميل يدخل على صفحة عامة محترمة، ومنها يختار التسجيل أو الدخول أو
                    الحجز المباشر.
                  </p>
                </div>

                <div className="rounded-[1.6rem] bg-primary-50 p-3 text-primary-700 shadow-[0_14px_34px_rgba(34,92,151,0.12)]">
                  <QrCode size={22} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Public Link
                </p>
                <p className="mt-2 break-all text-sm font-bold text-slate-900">{publicUrl}</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => handleCopy(publicUrl, 'الرابط العام')} className="btn-primary rounded-2xl py-3.5">
                  <Copy size={16} />
                  نسخ الرابط العام
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(publicUrl)}
                  className="rounded-2xl border border-primary-200 bg-primary-50 px-5 py-3.5 text-sm font-black text-primary-700 transition-all hover:bg-primary-100"
                >
                  <span className="inline-flex items-center gap-2">
                    <Share2 size={16} />
                    مشاركة الرابط
                  </span>
                </button>
              </div>
            </div>

            <div className="customer-panel-dark overflow-hidden p-5 sm:p-6 xl:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="customer-kicker">QR Access</p>
                  <h2 className="mt-2 text-2xl font-black text-white">افتحه بالكاميرا</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    لو العميل قدامك، امسح الـ QR وادخله مباشرة على الواجهة العامة.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-primary-100">
                  <QrCode size={20} />
                </div>
              </div>

              <div className="mt-5 flex justify-center rounded-[2rem] border border-white/10 bg-white/6 p-5">
                <div className="rounded-[1.8rem] bg-white p-4 shadow-[0_20px_54px_rgba(2,6,23,0.22)]">
                  <QRCodeSVG value={publicUrl} size={170} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-100/70">
                  Direct Customer Login
                </p>
                <p className="mt-2 break-all text-sm font-bold text-white">{customerLoginUrl}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(customerLoginUrl, 'رابط دخول العميل')}
                  className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white transition-all hover:bg-white/14"
                >
                  نسخ رابط دخول العميل مباشرة
                </button>
              </div>
            </div>

            <div className="customer-panel p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="customer-card-light">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                    Booking Link
                  </p>
                  <p className="mt-2 break-all text-sm font-bold text-slate-900">{bookingUrl}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(bookingUrl, 'رابط الحجز المباشر')}
                    className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-all hover:border-primary-200 hover:text-primary-700"
                  >
                    نسخ رابط الحجز
                  </button>
                </div>

                <div className="customer-card-light">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                    Admin Entry
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">دخول الإدارة</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    لو بتفتح البرنامج من جهاز الإدارة، الدخول الإداري موجود هنا بشكل منفصل
                    ومنظم.
                  </p>
                  <Link to="/admin-login" className="btn-primary mt-4 rounded-2xl py-3.5">
                    <LogIn size={16} />
                    دخول الإدارة والكاشير
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
