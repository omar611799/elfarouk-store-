import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store, Lock, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { attemptLogin, loading } = useAuth()
  const [pin, setPin] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!pin) return toast.error('يرجى إدخال رمز الدخول')
    if (pin.length < 4) return toast.error('رمز الدخول قصير جداً')
    
    await attemptLogin(pin)
  }

  // Create a stylized keypad for POS
  const triggerKey = (num) => {
    if (pin.length < 8) setPin(p => p + num)
  }
  const backspace = () => setPin(p => p.slice(0, -1))

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow mx-auto mb-4">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">أهلاً بك في الفاروق</h1>
          <p className="text-slate-400 text-sm mt-2">يرجى إدخال رمز الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div className="relative">
            <input 
              type="password" 
              readOnly // To prevent generic mobile keyboard from popping up if they just use the keypad
              value={pin.replace(/./g, '•')} 
              placeholder="••••"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-primary-500 transition-colors placeholder:tracking-normal placeholder:text-lg cursor-default"
            />
          </div>

          <div className="grid grid-cols-3 gap-3" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                type="button"
                key={num}
                onClick={() => triggerKey(num.toString())}
                className="bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 rounded-xl py-4 text-xl font-bold transition-all text-white"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={backspace}
              className="bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-white/5 rounded-xl py-4 text-xl font-bold transition-all text-red-400 flex items-center justify-center gap-1"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => triggerKey('0')}
              className="bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 rounded-xl py-4 text-xl font-bold transition-all text-white"
            >
              0
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-500 active:bg-primary-700 border border-white/5 rounded-xl py-4 text-xl font-bold transition-all text-white flex items-center justify-center rounded-br-2xl"
            >
              <KeyRound size={20} />
            </button>
          </div>

        </form>

        <div className="mt-6 text-center">
            {loading && <p className="text-primary-400 text-sm font-semibold animate-pulse">جاري التحقق...</p>}
        </div>
      </motion.div>
    </div>
  )
}
