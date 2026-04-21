import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, KeyRound, Sparkles, Delete } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { attemptLogin, loading } = useAuth()
  const [pin, setPin] = useState('')

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    if (!pin) return toast.error('يرجى إدخال رمز الدخول')
    if (pin.length < 4) return toast.error('رمز الدخول قصير جداً')
    await attemptLogin(pin)
  }

  const triggerKey = (num) => {
    if (pin.length < 6) setPin(p => p + num)
  }
  const backspace = () => setPin(p => p.slice(0, -1))

  // Auto-submit when PIN length reaches 4 (or 6 if applicable)
  useEffect(() => {
    if (pin.length === 4) {
       const timer = setTimeout(() => handleLogin(), 300)
       return () => clearTimeout(timer)
    }
  }, [pin])

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
              <p className="mt-3 text-sm font-semibold text-slate-500">دخول آمن وسريع إلى نظام الإدارة</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">
                <ShieldCheck size={14} /> PIN Access
              </div>
            </div>

            <div className="space-y-8 sm:space-y-10">
              <div className="flex justify-center gap-2.5 sm:gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <motion.div
                    key={idx}
                    initial={false}
                    animate={{
                      scale: pin.length > idx ? 1.04 : 1,
                      backgroundColor: pin.length > idx ? 'rgba(34, 92, 151, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                      borderColor: pin.length > idx ? 'rgba(34, 92, 151, 0.8)' : 'rgba(203, 213, 225, 0.85)',
                    }}
                    className="relative flex h-14 w-11 items-center justify-center overflow-hidden rounded-2xl border-2 text-xl font-black text-primary-700 shadow-sm sm:h-16 sm:w-12 sm:text-2xl"
                  >
                    <AnimatePresence>
                      {pin[idx] && (
                        <motion.span
                          initial={{ y: 16, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -16, opacity: 0 }}
                          className="relative z-10"
                        >
                          •
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {pin.length === idx && (
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute bottom-3 h-0.5 w-4 bg-primary-500"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4" dir="ltr">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <motion.button
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(238,245,251,0.9)' }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    key={num}
                    onClick={() => triggerKey(num.toString())}
                    className="rounded-2xl border border-primary-100 bg-white py-4 text-xl font-black text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:border-primary-300 sm:py-5 sm:text-2xl"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(244,63,94,0.08)' }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={backspace}
                  className="flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 py-4 text-rose-600 transition-all hover:border-rose-200 sm:py-5"
                  aria-label="Backspace"
                >
                  <Delete size={24} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(238,245,251,0.9)' }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => triggerKey('0')}
                  className="rounded-2xl border border-primary-100 bg-white py-4 text-xl font-black text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:border-primary-300 sm:py-5 sm:text-2xl"
                >
                  0
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleLogin}
                  disabled={loading || pin.length < 4}
                  className="flex items-center justify-center rounded-2xl border border-primary-500/20 bg-[linear-gradient(135deg,#153d65_0%,#225c97_100%)] py-4 text-white shadow-[0_18px_40px_rgba(34,92,151,0.22)] transition-all disabled:opacity-45 disabled:shadow-none sm:py-5"
                  aria-label="Login"
                >
                  <KeyRound size={24} />
                </motion.button>
              </div>
            </div>

            <div className="mt-8 text-center sm:mt-10">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 py-2"
                  >
                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 rounded-full bg-primary-500" />
                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 rounded-full bg-primary-500" />
                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 rounded-full bg-primary-500" />
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500"
                  >
                    <Sparkles size={12} className="text-primary-500" /> جاهز للعمل على الديسكتوب والموبايل
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
