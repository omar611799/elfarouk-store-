import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useStore } from '../context/StoreContext'

const STORAGE_KEY = 'elfarouk_customer_session'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const { registerCustomerAccount, loginCustomerAccount } = useStore()
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
      let account
      if (mode === 'register') {
        const id = await registerCustomerAccount({ name: name.trim(), phone: cleanPhone, pin })
        account = { id, name: name.trim(), phone: cleanPhone }
      } else {
        account = await loginCustomerAccount({ phone: cleanPhone, pin })
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: account.id,
        name: account.name,
        phone: account.phone,
      }))
      toast.success('تم دخول حساب العميل')
      navigate('/customer/booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
      <div className="max-w-md mx-auto mt-10 card p-6 space-y-5">
        <h1 className="text-2xl font-black">{mode === 'login' ? 'دخول العميل' : 'إنشاء حساب عميل'}</h1>
        <p className="text-sm text-slate-400">حساب واحد للعميل للحجز، الدفع، ومتابعة الإشعارات والشات.</p>
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-xl">
          <button type="button" onClick={() => setMode('login')} className={`rounded-lg py-2 text-sm ${mode === 'login' ? 'bg-primary-600 text-white' : 'text-slate-300'}`}>دخول</button>
          <button type="button" onClick={() => setMode('register')} className={`rounded-lg py-2 text-sm ${mode === 'register' ? 'bg-primary-600 text-white' : 'text-slate-300'}`}>تسجيل جديد</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input className="input" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input className="input" placeholder="PIN (4 أرقام)" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'جاري التنفيذ...' : mode === 'login' ? 'دخول لحجز الصيانة' : 'إنشاء حساب والبدء'}
          </button>
        </form>
        <Link to="/admin-login" className="text-primary-400 text-sm">دخول الأدمن فقط</Link>
      </div>
    </div>
  )
}
