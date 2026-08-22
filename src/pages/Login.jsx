import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import {
  ArrowUpLeft,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCog,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STAFF_FEATURES = [
  {
    icon: UserCog,
    title: 'إدارة كاملة',
    body: 'لوحة تحكم للمخزن والمبيعات والعملاء والفواتير من نفس النظام.',
  },
  {
    icon: ShieldCheck,
    title: 'وصول آمن',
    body: 'الدخول الإداري منفصل عن تجربة العميل ويحافظ على وضوح الصلاحيات.',
  },
  {
    icon: Wrench,
    title: 'تشغيل يومي',
    body: 'واجهة مناسبة للشغل الفعلي اليومي بدون زحمة أو خطوات غير ضرورية.',
  },
]

export default function Login() {
  const { attemptAdminLogin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    if (!email.trim()) return toast.error('أدخل البريد الإلكتروني')
    if (!password) return toast.error('أدخل كلمة المرور')
    await attemptAdminLogin(email.trim(), password)
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
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="customer-panel-dark customer-shimmer hidden overflow-hidden p-7 lg:flex lg:flex-col lg:justify-between xl:p-10"
          >
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="customer-chip">
                  <Sparkles size={12} />
                  Staff Access
                </div>
                <div className="customer-chip">
                  <ShieldCheck size={12} />
                  Secure Entry
                </div>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, rotate: -6 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="rounded-[2rem] bg-white p-3 shadow-[0_24px_60px_rgba(2,6,23,0.26)]"
                >
                  <img
                    src="/brand-logo.png"
                    alt="ELFAROUK Service"
                    className="h-20 w-20 object-contain"
                  />
                </motion.div>

                <div>
                  <p className="customer-kicker">ELFAROUK SERVICE</p>
                  <h1 className="customer-title mt-3 text-4xl leading-tight">
                    دخول الإدارة والكاشير
                    <br />
                    بنفس مستوى التنظيم
                  </h1>
                </div>
              </div>

              <p className="customer-subtitle max-w-2xl text-base">
                نفس واجهة النظام الحديثة، لكن بمسار واضح ومخصص للموظفين فقط، سواء للإدارة أو
                الكاشير، مع الحفاظ على فصل كامل عن تجربة العميل.
              </p>

              <div className="grid gap-4 xl:grid-cols-3">
                {STAFF_FEATURES.map(({ icon: Icon, title, body }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 + index * 0.09 }}
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
              transition={{ delay: 0.38 }}
              className="mt-8 grid gap-4 sm:grid-cols-3"
            >
              <Link to="/" className="customer-card-soft block">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Public Home
                </p>
                <p className="mt-3 text-2xl font-black text-white">/</p>
                <p className="mt-2 text-sm text-slate-300">
                  ارجع للواجهة العامة لو الجهاز مخصص للاستقبال أو مشاركة الرابط.
                </p>
              </Link>
              <Link to="/customer/login?mode=login" className="customer-card-soft block">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Customer
                </p>
                <p className="mt-3 text-2xl font-black text-white">Login</p>
                <p className="mt-2 text-sm text-slate-300">
                  لو العميل على الجهاز، افتح له صفحة الدخول مباشرة.
                </p>
              </Link>
              <Link to="/customer/login?mode=register" className="customer-card-soft block">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-100/70">
                  Register
                </p>
                <p className="mt-3 text-2xl font-black text-white">New</p>
                <p className="mt-2 text-sm text-slate-300">
                  ابدأ تسجيل عميل جديد من غير ما ترجع للصفحة العامة.
                </p>
              </Link>
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
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
                      to="/customer/login?mode=login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition-all hover:border-primary-200 hover:text-primary-700"
                    >
                      <ArrowUpLeft size={14} />
                      دخول العميل
                    </Link>
                  </div>

                  <div className="customer-chip !border-primary-200 !bg-primary-50 !text-primary-700">
                    <ShieldCheck size={12} />
                    Staff Secure Entry
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0.9, rotate: -6 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-[1.7rem] bg-white p-2.5 shadow-[0_16px_45px_rgba(16,36,59,0.14)] ring-1 ring-slate-100"
                  >
                    <img
                      src="/brand-logo.png"
                      alt="ELFAROUK Service"
                      className="h-16 w-16 object-contain"
                    />
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                      ELFAROUK SERVICE
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      دخول الإدارة والكاشير
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      استخدم البريد الإلكتروني وكلمة المرور الخاصة بحساب الموظف المعتمد في
                      Firebase. لا توجد بيانات دخول ثابتة داخل الواجهة نفسها.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    className="input h-14 rounded-2xl border-slate-200 bg-white/90 pr-12"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-2xl py-4 text-sm font-black shadow-[0_20px_45px_rgba(21,61,101,0.28)]"
                >
                  <LogIn size={18} />
                  {loading ? 'جارٍ تسجيل الدخول...' : 'دخول الموظف'}
                </motion.button>
              </form>


            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
