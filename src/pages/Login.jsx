import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ShieldCheck, KeyRound, Sparkles, Delete, Cpu } from 'lucide-react'
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
       // Optional: delay slightly for visual feedback
       const timer = setTimeout(() => handleLogin(), 300);
       return () => clearTimeout(timer);
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-display pt-safe pb-safe" dir="rtl">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[70%] h-[70%] bg-electric-600/10 blur-[100px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-cyan-600/5 blur-[80px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
        
        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="glass-card max-w-sm w-full relative z-10 !p-6 sm:!p-10"
      >
        <div className="text-center mb-8 sm:mb-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-electric-600 to-cyan-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            <Cpu size={32} className="text-white sm:hidden" />
            <Cpu size={36} className="text-white hidden sm:block" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-3">الفاروق ستور</h1>
          <div className="flex items-center justify-center gap-2 opacity-60">
            <ShieldCheck size={14} className="text-electric-400" />
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">نظام التشفير المتطور</p>
          </div>
        </div>

        <div className="space-y-8 sm:space-y-10">
          
          {/* Animated PIN Display */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{ 
                  scale: pin.length > idx ? 1.1 : 1,
                  backgroundColor: pin.length > idx ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: pin.length > idx ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                }}
                className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-inner transition-all overflow-hidden relative"
              >
                <AnimatePresence>
                  {pin[idx] && (
                    <motion.span
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
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
                     className="absolute bottom-3 w-3 sm:w-4 h-0.5 bg-electric-400" 
                   />
                )}
              </motion.div>
            ))}
          </div>

          {/* Premium Numpad */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                type="button"
                key={num}
                onClick={() => triggerKey(num.toString())}
                className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl py-4 sm:py-5 text-xl sm:text-2xl font-black transition-all text-white font-display backdrop-blur-md hover:border-white/20 active:bg-electric-500/20 shadow-sm"
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(244,63,94,0.1)' }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={backspace}
              className="bg-rose-500/5 border border-rose-500/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 text-xl font-black transition-all text-rose-500 flex items-center justify-center hover:border-rose-500/30"
              aria-label="Backspace"
            >
              <Delete size={24} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => triggerKey('0')}
              className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl py-4 sm:py-5 text-xl sm:text-2xl font-black transition-all text-white font-display backdrop-blur-md"
            >
              0
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLogin}
              disabled={loading || pin.length < 4}
              className="bg-electric-600 hover:bg-electric-500 border border-electric-400/20 rounded-xl sm:rounded-2xl py-4 sm:py-5 transition-all text-white flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:shadow-none"
              aria-label="Login"
            >
              <KeyRound size={24} />
            </motion.button>
          </div>

        </div>

        <div className="mt-8 sm:mt-10 text-center">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-2"
                >
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-electric-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-electric-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-electric-500 rounded-full" />
                </motion.div>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} className="text-electric-400 animate-pulse" /> نظام الفاروق لإدارة المحلات
                </motion.p>
              )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>

  )
}
