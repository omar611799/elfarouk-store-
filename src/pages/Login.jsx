import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Lock, KeyRound, Sparkles, Delete } from 'lucide-react'
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
    if (pin.length < 8) setPin(p => p + num)
  }
  const backspace = () => setPin(p => p.slice(0, -1))

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-200 flex items-center justify-center p-6 relative overflow-hidden font-display" dir="rtl">
      
      {/* Background Decorative Grains */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-electric-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/5 blur-[100px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card !p-10 max-w-sm w-full shadow-premium relative z-10 border-white/10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-electric-600 to-electric-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neon rotate-3 hover:rotate-0 transition-transform duration-500">
            <Store size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-3">الفاروق ستور</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">نظام الإدارة المتكامل</p>
        </div>

        <div className="space-y-8">
          
          <div className="relative group">
            <div className="absolute inset-x-0 -top-4 text-center">
                <span className="text-[10px] text-electric-400 font-black uppercase tracking-widest bg-electric-500/10 px-3 py-1 rounded-full border border-electric-500/20 shadow-neon">يجب إدخال الرمز</span>
            </div>
            <input 
              type="password" 
              readOnly 
              value={pin.replace(/./g, '•')} 
              placeholder="••••"
              className="w-full bg-obsidian-900/60 border border-white/10 rounded-[2rem] py-6 px-4 text-center text-4xl tracking-[0.8em] text-white focus:outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/10 transition-all placeholder:tracking-normal placeholder:text-lg cursor-default shadow-inner"
            />
          </div>

          <div className="grid grid-cols-3 gap-4" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                type="button"
                key={num}
                onClick={() => triggerKey(num.toString())}
                className="bg-white/5 border border-white/5 rounded-2xl py-5 text-2xl font-black transition-all text-white font-display"
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(244,63,94,0.1)' }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={backspace}
              className="bg-rose-500/5 border border-rose-500/10 rounded-2xl py-5 text-xl font-black transition-all text-rose-500 flex items-center justify-center"
            >
              <Delete size={24} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => triggerKey('0')}
              className="bg-white/5 border border-white/5 rounded-2xl py-5 text-2xl font-black transition-all text-white font-display"
            >
              0
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="bg-electric-600 hover:bg-electric-500 border border-electric-400/20 rounded-2xl py-5 transition-all text-white flex items-center justify-center shadow-neon disabled:opacity-50"
            >
              <KeyRound size={24} />
            </motion.button>
          </div>

        </div>

        <div className="mt-10 text-center">
            {loading ? (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            ) : (
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <Sparkles size={10} /> نظام الفاروق المحمي
                </p>
            )}
        </div>
      </motion.div>
    </div>
  )
}
