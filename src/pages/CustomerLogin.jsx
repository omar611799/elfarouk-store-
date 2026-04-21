import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { ShieldCheck, UserPlus, LogIn, Smartphone, Lock } from 'lucide-react'

function phoneToEmail(phone) {
  const clean = String(phone || '').replace(/\D/g, '')
  return `${clean}@customer.elfarouk.local`
}

export default function CustomerLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanPhone = phone.trim()
    if (mode === 'register' && !name.trim()) return toast.error('اكتب الاسم')
    if (cleanPhone.length < 10) return toast.error('رقم الهاتف غير صحيح')
    if (pin.length < 4) return toast.error('PIN لازم 4 أرقام على الأقل')

    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, phoneToEmail(cleanPhone), pin)
        const uid = cred.user.uid
        await setDoc(doc(db, 'users', uid), { role: 'customer', name: name.trim(), phone: cleanPhone, createdAt: serverTimestamp() }, { merge: true })
        await setDoc(doc(db, 'customerAccounts', uid), { uid, name: name.trim(), phone: cleanPhone, status: 'active', createdAt: serverTimestamp() }, { merge: true })
      } else {
        const cred = await signInWithEmailAndPassword(auth, phoneToEmail(cleanPhone), pin)
        const uid = cred.user.uid
        await setDoc(doc(db, 'users', uid), { role: 'customer', phone: cleanPhone, updatedAt: serverTimestamp() }, { merge: true })
      }
      toast.success('تم دخول حساب العميل')
      navigate('/customer/booking')
    } catch (e) {
      console.error(e)
      toast.error('تعذر تسجيل/دخول العميل. تأكد من الرقم والـ PIN')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6" dir="rtl">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,#0b1f33_0%,#102b45_55%,#173d62_100%)] shadow-[0_30px_90px_rgba(3,10,20,0.45)]">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-100">
              <ShieldCheck size={12} />
              Secure Customer Access
            </div>
            <h1 className="text-3xl font-black text-white">{mode === 'login' ? 'دخول العميل' : 'إنشاء حساب عميل'}</h1>
            <p className="mt-3 text-sm leading-6 text-primary-100/80">تجربة حجز احترافية: دخول سريع، حجز مباشر، متابعة حالة الدفع والشات من نفس الحساب.</p>
          </div>

          <div className="space-y-5 bg-white px-6 py-6 sm:px-8">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button type="button" onClick={() => setMode('login')} className={`rounded-lg py-2.5 text-sm font-black transition-all ${mode === 'login' ? 'bg-primary-600 text-white shadow-[0_10px_25px_rgba(34,92,151,0.25)]' : 'text-slate-600'}`}>دخول</button>
              <button type="button" onClick={() => setMode('register')} className={`rounded-lg py-2.5 text-sm font-black transition-all ${mode === 'register' ? 'bg-primary-600 text-white shadow-[0_10px_25px_rgba(34,92,151,0.25)]' : 'text-slate-600'}`}>تسجيل جديد</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <input className="input" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <div className="relative">
                <Smartphone size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pr-9" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pr-9" placeholder="PIN (4 أرقام على الأقل)" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              </div>
              <button className="btn-primary w-full py-3.5 text-sm" type="submit" disabled={loading}>
                {loading ? 'جاري التنفيذ...' : mode === 'login' ? 'دخول لحجز الصيانة' : 'إنشاء حساب والبدء'}
              </button>
            </form>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              {mode === 'login' ? (
                <span className="inline-flex items-center gap-2"><LogIn size={13} className="text-primary-600" /> استخدم رقمك والـ PIN الخاص بك للمتابعة.</span>
              ) : (
                <span className="inline-flex items-center gap-2"><UserPlus size={13} className="text-primary-600" /> إنشاء الحساب يتم مرة واحدة فقط لكل رقم.</span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <Link to="/admin-login" className="text-sm font-black text-primary-600 hover:text-primary-700">دخول الأدمن فقط</Link>
              <span className="text-[11px] font-semibold text-slate-400">ELFAROUK Service</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
