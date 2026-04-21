import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'elfarouk_customer_session'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanPhone = phone.trim()
    if (!name.trim()) return toast.error('اكتب الاسم')
    if (cleanPhone.length < 10) return toast.error('رقم الهاتف غير صحيح')

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: name.trim(),
      phone: cleanPhone,
    }))
    toast.success('تم دخول حساب العميل')
    navigate('/service-booking')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
      <div className="max-w-md mx-auto mt-10 card p-6 space-y-5">
        <h1 className="text-2xl font-black">دخول العميل</h1>
        <p className="text-sm text-slate-400">ادخل بياناتك مرة واحدة للحجز ومتابعة الشات.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button className="btn-primary w-full" type="submit">دخول لحجز الصيانة</button>
        </form>
        <Link to="/admin-login" className="text-primary-400 text-sm">دخول الأدمن</Link>
      </div>
    </div>
  )
}
