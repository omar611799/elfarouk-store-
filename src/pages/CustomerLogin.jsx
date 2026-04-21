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
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6" dir="rtl">
      <div className="mx-auto max-w-md space-y-6">
        <div className="card border-primary-200 bg-gradient-to-b from-white to-slate-50 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">ELFAROUK Booking</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">{mode === 'login' ? 'دخول العميل' : 'تسجيل عميل جديد'}</h1>
            </div>
            <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
              {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
          </div>

          <p className="mb-4 text-sm font-semibold text-slate-500">واجهة آمنة وسريعة للحجز، الدفع، ومتابعة حالة الطلب.</p>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setMode('login')} className={`rounded-lg py-2 text-sm font-bold ${mode === 'login' ? 'bg-primary-600 text-white' : 'text-slate-600'}`}>دخول</button>
            <button type="button" onClick={() => setMode('register')} className={`rounded-lg py-2 text-sm font-bold ${mode === 'register' ? 'bg-primary-600 text-white' : 'text-slate-600'}`}>تسجيل جديد</button>
          </div>

          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>تأمين الحساب مفعل</span>
            </div>
            رقم الهاتف + PIN للدخول السريع من أي موبايل.
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
            <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? 'جارٍ التنفيذ...' : mode === 'login' ? 'دخول لحجز الصيانة' : 'إنشاء حساب والبدء'}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <Link to="/admin-login" className="text-sm font-bold text-primary-600 hover:text-primary-700">دخول الأدمن فقط</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
