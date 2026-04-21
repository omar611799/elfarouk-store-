import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function Login() {
  const { attemptAdminLogin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim()) return toast.error('أدخل البريد الإلكتروني')
    if (!password) return toast.error('أدخل كلمة المرور')
    await attemptAdminLogin(email.trim(), password)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8fc] px-4 py-6 font-display sm:px-6" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,92,151,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(23,29,39,0.12),transparent_30%)]" />
        <div className="absolute right-[-7rem] top-[-5rem] h-72 w-72 rounded-full bg-primary-300/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-80 w-80 rounded-full bg-slate-300/35 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden flex-col justify-between overflow-hidden rounded-[2rem] border border-primary-400/20 bg-[linear-gradient(135deg,#0f2238_0%,#164c7e_56%,#225c97_100%)] p-8 text-white shadow-[0_30px_90px_rgba(15,34,56,0.22)] lg:flex"
          >
            <div>
              <div className="flex items-center gap-4">
                <div className="rounded-[1.75rem] bg-white p-3 shadow-[0_18px_50px_rgba(8,17,28,0.22)]">
                  <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-24 w-24 object-contain" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary-100">ELFAROUK SERVICE</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight">تجربة أسرع وهوية أوضح للمخزن والخدمة</h2>
                </div>
              </div>
              <p className="mt-8 max-w-lg text-sm leading-7 text-primary-50/90">
                واجهة تشغيل عملية للمبيعات والمخزون والفواتير، مبنية لتكون واضحة على الديسكتوب ومريحة على الموبايل.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-100">Contrast</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/90">ألوان أهدأ مع تباين أقوى للنصوص والأزرار والعناصر الأساسية.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-100">Mobile First</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/90">مساحات أكبر للمس وأزرار أوضح تناسب الاستخدام اليومي من الهاتف.</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary-100/80">Secure PIN Access</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="glass-card relative mx-auto w-full max-w-md overflow-hidden !p-6 sm:!p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#153d65_0%,#225c97_60%,#5d6a7c_100%)]" />

            <div className="mb-8 text-center sm:mb-10">
              <div className="mx-auto mb-5 w-fit rounded-[1.8rem] bg-white p-2.5 shadow-[0_18px_50px_rgba(34,92,151,0.14)] ring-1 ring-primary-100">
                <img src="/brand-logo.png" alt="ELFAROUK Service" className="h-20 w-auto object-contain sm:h-24" />
              </div>
              <h1 className="text-2xl font-black leading-none tracking-tight text-slate-950 sm:text-3xl">ELFAROUK Service</h1>
              <p className="mt-3 text-sm font-semibold text-slate-500">دخول الأدمن بالبريد الإلكتروني وكلمة المرور</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Link to="/customer-login" className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-700">
                  دخول العميل للحجز
                </Link>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">
                <ShieldCheck size={14} /> Admin Secure Access
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                className="input"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="input"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-500/20 bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] py-4 text-white shadow-[0_18px_40px_rgba(34,92,151,0.22)] transition-all disabled:opacity-45 disabled:shadow-none"
              >
                <LogIn size={18} /> {loading ? 'جاري تسجيل الدخول...' : 'دخول الأدمن'}
              </motion.button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                بيانات الأدمن المعتمدة
              </p>
              <p className="mt-1 text-xs text-slate-500">omarabdelhamead611@gmail.com</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
