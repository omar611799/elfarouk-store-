import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import {
  ArrowUpLeft,
  CalendarCheck2,
  Gem,
  Lock,
  LogIn,
  Mail,
  MessageCircleMore,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { auth } from '../firebase/config'
import {
  requestCustomerVerificationCode,
  verifyCustomerVerificationCode,
} from '../services/customerAuthApi'
import {
  CUSTOMER_EMAIL_RE,
  normalizeCustomerDigits,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  resolveCustomerLoginEmail,
} from '../utils/customerAuth'

const EXPERIENCE_POINTS = [
  {
    icon: CalendarCheck2,
    title: 'تسجيل أوضح',
    body: 'أنشئ الحساب بسرعة، واربطه برقم الهاتف الذي ستعمل عليه كل صفحات العميل.',
  },
  {
    icon: MessageCircleMore,
    title: 'دخول موثوق',
    body: 'بعد تأكيد البريد، العميل يدخل ويتابع الحجز والرسائل والبوابة على نفس الرقم.',
  },
  {
    icon: Gem,
    title: 'رحلة أنظف',
    body: 'كل رحلة العميل تبقى أوضح: تسجيل منظم، ورقم ثابت، ومتابعة من نفس الحساب.',
  },
]

const TRUST_POINTS = ['رقم هاتف أساسي', 'كود تحقق على الإيميل', 'متابعة على نفس الحساب']

const EMPTY_REGISTER_FORM = {
  name: '',
  email: '',
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',
}

function getModeFromParams(searchParams) {
  const mode = searchParams.get('mode')
  return mode === 'register' ? 'register' : 'login'
}

function getRedirectFromParams(searchParams) {
  const redirect = searchParams.get('redirect')
  return redirect && redirect.startsWith('/') ? redirect : '/customer/account'
}

export default function CustomerLogin() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState(getModeFromParams(searchParams))
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerStep, setRegisterStep] = useState('details')
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER_FORM)
  const [sentEmailHint, setSentEmailHint] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(getModeFromParams(searchParams))
  }, [searchParams])

  const normalizedRegisterEmail = useMemo(
    () => normalizeCustomerEmail(registerForm.email),
    [registerForm.email]
  )

  const switchMode = (nextMode) => {
    setMode(nextMode)
    const redirect = searchParams.get('redirect')
    const nextParams = new URLSearchParams()
    nextParams.set('mode', nextMode)
    if (redirect) nextParams.set('redirect', redirect)
    setSearchParams(nextParams, { replace: true })

    if (nextMode === 'register') {
      setRegisterStep('details')
      setSentEmailHint('')
    }
  }

  const updateRegisterField = (key) => (event) => {
    const nextValue = event.target.value
    setRegisterForm((prev) => ({
      ...prev,
      [key]: key === 'phone' ? normalizeCustomerPhone(nextValue) : nextValue,
    }))
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    const t = toast.loading('جاري الاتصال بحساب جوجل...')
    try {
      await signInWithPopup(auth, provider)
      toast.success('أهلاً بك في الفاروق ستور', { id: t })
      navigate(getRedirectFromParams(searchParams))
    } catch (error) {
      console.error(error)
      toast.error('تعذر الدخول باستخدام جوجل، جرب مرة أخرى', { id: t })
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    const email = resolveCustomerLoginEmail(loginIdentifier)
    if (!email) return toast.error('اكتب البريد الإلكتروني')
    if (!loginPassword) return toast.error('اكتب كلمة المرور')

    const t = toast.loading('جاري التحقق من بياناتك...')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, loginPassword)
      toast.success('أهلاً بك مرة تانية في الفاروق ستور', { id: t })
      navigate(getRedirectFromParams(searchParams))
    } catch (error) {
      console.error(error)
      toast.error('البيانات غير صحيحة، تأكد من الإيميل والباسورد', { id: t })
    } finally {
      setLoading(false)
    }
  }

  const requestCode = async () => {
    const payload = {
      name: registerForm.name.trim(),
      email: normalizedRegisterEmail,
      phone: normalizeCustomerPhone(registerForm.phone),
    }

    if (!payload.name) return toast.error('اكتب الاسم')
    if (!CUSTOMER_EMAIL_RE.test(payload.email)) return toast.error('اكتب بريدًا إلكترونيًا صحيحًا')
    if (payload.phone.length < 10) return toast.error('رقم الهاتف غير صحيح')

    setRegisterStep('verify')
    setSentEmailHint(payload.email)
    setLoading(true)
    try {
      const result = await requestCustomerVerificationCode(payload)
      setSentEmailHint(result.email || payload.email)
      toast.success('أرسلنا كود التحقق على البريد الإلكتروني')
    } catch (error) {
      setRegisterStep('details')
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyCodeAndCreateAccount = async () => {
    const email = normalizedRegisterEmail
    const code = normalizeCustomerDigits(registerForm.code).slice(0, 6)
    const password = String(registerForm.password || '')
    const confirmPassword = String(registerForm.confirmPassword || '')

    if (!CUSTOMER_EMAIL_RE.test(email)) return toast.error('البريد الإلكتروني غير صحيح')
    if (code.length !== 6) return toast.error('اكتب كود التحقق من 6 أرقام')
    if (password.length < 6) return toast.error('كلمة المرور لازم تكون 6 أحرف على الأقل')
    if (password !== confirmPassword) return toast.error('تأكيد كلمة المرور غير مطابق')

    setLoading(true)
    try {
      await verifyCustomerVerificationCode({ email, code, password })
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('تم إنشاء الحساب وربطه برقم الهاتف، وتقدر تكمل الخدمة الآن')
      navigate(getRedirectFromParams(searchParams))
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    if (registerStep === 'details') {
      await requestCode()
      return
    }

    await verifyCodeAndCreateAccount()
  }

  const openVerifyStep = () => {
    if (!CUSTOMER_EMAIL_RE.test(normalizedRegisterEmail)) {
      toast.error('اكتب البريد الإلكتروني الذي استلم عليه الكود أولًا')
      return
    }

    setSentEmailHint(normalizedRegisterEmail)
    setRegisterStep('verify')
  }

  const goBackToRegisterDetails = () => {
    setRegisterStep('details')
    setRegisterForm((prev) => ({
      ...prev,
      code: '',
      password: '',
      confirmPassword: '',
    }))
  }

  return (
    <main className="customer-shell px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <div className="customer-grid" />
      <div className="customer-noise" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:gap-8">
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="customer-panel-dark customer-shimmer hidden overflow-hidden p-7 lg:flex lg:flex-col lg:justify-between xl:p-10"
          >
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="customer-chip">
                  <Sparkles size={12} />
                  Customer Entry
                </div>
                <div className="customer-chip">
                  <ShieldCheck size={12} />
                  Real Email Verification
                </div>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, rotate: -6 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="rounded-[2rem] bg-white p-3 shadow-[0_24px_60px_rgba(2,6,23,0.26)]"
                >
                  <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-20 w-20 object-contain" />
                </motion.div>

                <div>
                  <p className="customer-kicker">ELFAROUK SERVICE</p>
                  <h1 className="customer-title mt-3 text-4xl leading-tight">
                    تسجيل عميل
                    <br />
                    بحساب حقيقي
                  </h1>
                </div>
              </div>

              <p className="customer-subtitle max-w-2xl text-base">
                العميل الآن يسجل بإيميله الحقيقي، يصله كود تحقق على البريد، ثم يكمل فتح
                الحساب ويدخل على الخدمة بشكل طبيعي وواضح.
              </p>

              <div className="flex flex-wrap gap-3">
                {TRUST_POINTS.map((point, index) => (
                  <motion.span
                    key={point}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="customer-chip"
                  >
                    <ShieldCheck size={12} />
                    {point}
                  </motion.span>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {EXPERIENCE_POINTS.map(({ icon: Icon, title, body }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + index * 0.1 }}
                    className="customer-card-soft"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-100">
                      <Icon size={20} />
                    </div>
                    <h2 className="text-lg font-black text-white">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8 grid gap-4 sm:grid-cols-3"
            >
              <Link to="/" className="customer-card-soft block">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Public Home
                </p>
                <p className="mt-3 text-2xl font-black text-white">/</p>
                <p className="mt-2 text-sm text-slate-300">ارجع للواجهة العامة أو شارك الرابط مع عميل جديد.</p>
              </Link>
              <button type="button" onClick={() => switchMode('register')} className="customer-card-soft text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Register
                </p>
                <p className="mt-3 text-2xl font-black text-white">Email</p>
                <p className="mt-2 text-sm text-slate-300">سجل بالإيميل الحقيقي واستقبل كود التحقق على البريد.</p>
              </button>
              <Link to="/admin-login" className="customer-card-soft block">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Admin
                </p>
                <p className="mt-3 text-2xl font-black text-white">Secure</p>
                <p className="mt-2 text-sm text-slate-300">لو الجهاز إداري، تقدر تفتح دخول الإدارة من هنا.</p>
              </Link>
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="customer-panel overflow-hidden p-5 sm:p-7 xl:p-8"
          >
            <div className="mx-auto max-w-lg">
              <div className="mb-6 flex flex-col gap-5 sm:mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition-all hover:border-primary-200 hover:text-primary-700"
                    >
                      <ArrowUpLeft size={14} />
                      الواجهة العامة
                    </Link>
                    <Link
                      to="/admin-login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition-all hover:border-primary-200 hover:text-primary-700"
                    >
                      <ArrowUpLeft size={14} />
                      دخول الإدارة
                    </Link>
                  </div>

                  <div className="customer-chip !border-primary-200 !bg-primary-50 !text-primary-700">
                    <Sparkles size={12} />
                    Customer Access
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0.9, rotate: -6 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-[1.7rem] bg-white p-2.5 shadow-[0_16px_45px_rgba(16,36,59,0.14)] ring-1 ring-slate-100"
                  >
                    <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-16 w-16 object-contain" />
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                      ELFAROUK SERVICE
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      {mode === 'login' ? 'دخول العميل' : 'إنشاء حساب العميل'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {mode === 'login'
                        ? 'ادخل بالإيميل وكلمة المرور، وصفحات العميل ستكمل معك على رقم الهاتف المسجل.'
                        : registerStep === 'details'
                          ? 'اكتب بيانات العميل، وسنرسل كود التحقق على البريد، ثم نربط الحساب برقم الهاتف.'
                          : 'اكتب الكود الذي وصلك على البريد، ثم اختر كلمة المرور لإكمال الحساب على نفس الرقم.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="customer-card-light mb-5 p-2">
                <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] bg-slate-100/80 p-1.5">
                  {[
                    { id: 'login', label: 'دخول' },
                    { id: 'register', label: 'تسجيل' },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => switchMode(tab.id)}
                      className={`relative rounded-[1rem] px-4 py-3 text-sm font-black transition-colors ${
                        mode === tab.id ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {mode === tab.id && (
                        <motion.span
                          layoutId="customer-auth-mode"
                          className="absolute inset-0 rounded-[1rem] bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] shadow-[0_16px_34px_rgba(21,61,101,0.22)]"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Google Login Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black py-4 rounded-2xl transition-all shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span>الدخول السريع بحساب جوجل</span>
                </button>
                <div className="relative my-6 flex items-center">
                  <div className="flex-1 border-t border-slate-100"></div>
                  <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">أو يدويًا</span>
                  <div className="flex-1 border-t border-slate-100"></div>
                </div>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                      placeholder="البريد الإلكتروني أو رقم الهاتف القديم"
                      type="text"
                      dir="ltr"
                      value={loginIdentifier}
                      onChange={(event) => setLoginIdentifier(event.target.value)}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                      placeholder="كلمة المرور"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn-primary mt-2 w-full rounded-2xl py-4 text-sm font-black shadow-[0_20px_45px_rgba(21,61,101,0.28)]"
                    type="submit"
                    disabled={loading}
                  >
                    <LogIn size={18} />
                    {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل دخول العميل'}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {registerStep === 'details' ? (
                      <motion.div
                        key="register-details"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-4"
                      >
                        <input
                          className="input h-14 rounded-2xl border-slate-200 bg-white/90"
                          placeholder="الاسم الكامل"
                          value={registerForm.name}
                          onChange={updateRegisterField('name')}
                          required
                        />

                        <div className="relative">
                          <Mail
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                            placeholder="البريد الإلكتروني"
                            type="email"
                            dir="ltr"
                            value={registerForm.email}
                            onChange={updateRegisterField('email')}
                            required
                          />
                        </div>

                        <div className="relative">
                          <Smartphone
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                            placeholder="رقم الهاتف"
                            value={registerForm.phone}
                            onChange={updateRegisterField('phone')}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={openVerifyStep}
                          className="btn-ghost w-full rounded-2xl py-3.5 text-sm font-bold"
                        >
                          عندي كود بالفعل
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="register-verify"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-4"
                      >
                        <div className="rounded-[1.4rem] border border-primary-100 bg-primary-50/70 px-4 py-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                            Verification Email
                          </p>
                          <p className="mt-2 text-sm font-black text-slate-900" dir="ltr">
                            {sentEmailHint || normalizedRegisterEmail}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-slate-500">
                            اكتب كود التحقق الذي وصلك على هذا البريد ثم اختر كلمة المرور.
                          </p>
                        </div>

                        <div className="relative">
                          <ShieldCheck
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12 text-center tracking-[0.35em]"
                            placeholder="كود التحقق"
                            inputMode="numeric"
                            value={normalizeCustomerDigits(registerForm.code).slice(0, 6)}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                code: normalizeCustomerDigits(event.target.value).slice(0, 6),
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="relative">
                          <Lock
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                            placeholder="كلمة المرور"
                            type="password"
                            value={registerForm.password}
                            onChange={updateRegisterField('password')}
                            required
                          />
                        </div>

                        <div className="relative">
                          <Lock
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                            placeholder="تأكيد كلمة المرور"
                            type="password"
                            value={registerForm.confirmPassword}
                            onChange={updateRegisterField('confirmPassword')}
                            required
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button type="button" onClick={goBackToRegisterDetails} className="btn-ghost rounded-2xl py-3.5">
                            تعديل البيانات
                          </button>
                          <button
                            type="button"
                            onClick={requestCode}
                            className="btn-outline rounded-2xl py-3.5"
                            disabled={loading}
                          >
                            إعادة إرسال الكود
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn-primary mt-2 w-full rounded-2xl py-4 text-sm font-black shadow-[0_20px_45px_rgba(21,61,101,0.28)]"
                    type="submit"
                    disabled={loading}
                  >
                    {registerStep === 'details' ? <Mail size={18} /> : <UserPlus size={18} />}
                    {loading
                      ? 'جار التنفيذ...'
                      : registerStep === 'details'
                        ? 'إرسال كود التحقق'
                        : 'تأكيد الكود وإنشاء الحساب'}
                  </motion.button>
                </form>
              )}

              <div className="customer-card-light mt-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                      Why It Feels Better
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">تسجيل أوضح وأكثر ثقة</h3>
                  </div>
                  <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {TRUST_POINTS.map((point) => (
                    <div
                      key={point}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-[11px] font-black text-slate-600"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {mode === 'login'
                    ? 'لو الحساب جديد فالدخول يتم بالإيميل وكلمة المرور، لكن الحجز والبوابة يظلان مربوطين برقم الهاتف المسجل.'
                    : registerStep === 'details'
                      ? 'سنرسل الكود على البريد الذي تكتبه هنا، ثم تعمل صفحات العميل كلها على رقم الهاتف الذي تضيفه.'
                      : 'إذا وصلك الكود بالفعل، اكتبه هنا وأكمل الحساب لتبدأ الحجز والمتابعة على نفس الرقم.'}
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
