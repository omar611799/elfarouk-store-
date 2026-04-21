import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'

const COMPLAINTS_PHONE = '01127930685'
const PAYMENT_NUMBER = '01115329887'

export default function ServiceBookingsAdmin() {
  const { serviceBookings, serviceMessages, notifications, updateServiceBooking, addServiceMessage, markNotificationAsRead } = useStore()
  const [selectedId, setSelectedId] = useState('')
  const [text, setText] = useState('')

  const bookings = useMemo(() => {
    return [...serviceBookings].sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
      const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
      return db - da
    })
  }, [serviceBookings])

  const selected = bookings.find(b => b.id === selectedId) || bookings[0]
  const messages = useMemo(() => {
    if (!selected?.id) return []
    return serviceMessages
      .filter(m => m.bookingId === selected.id)
      .sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        return da - db
      })
  }, [serviceMessages, selected?.id])

  const send = async () => {
    if (!selected?.id || !text.trim()) return
    await addServiceMessage({ bookingId: selected.id, sender: 'admin', text: text.trim() })
    setText('')
  }

  const adminNotifications = notifications.filter(n => n.audience === 'admin')
  const unreadCount = adminNotifications.filter(n => !n.read).length

  return (
    <div className="space-y-6" dir="rtl">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">إدارة حجوزات الصيانة</h1>
          <p className="text-slate-500 text-sm">تابع الحالة، الدفع، والدردشة مع العميل.</p>
          <p className="text-slate-500 text-xs mt-1">رقم تحصيل العربون: {PAYMENT_NUMBER} (InstaPay/محافظ)</p>
        </div>
        <div className="text-left">
          <a href={`tel:${COMPLAINTS_PHONE}`} className="btn-ghost">شكاوى: {COMPLAINTS_PHONE}</a>
          <p className="text-xs mt-2 text-slate-500">إشعارات غير مقروءة: {unreadCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 space-y-3 lg:col-span-1">
          <div className="border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="font-bold text-sm">إشعارات الإدارة</p>
            {adminNotifications.length === 0 && <p className="text-xs text-slate-500">لا يوجد إشعارات</p>}
            {adminNotifications.slice(0, 5).map(n => (
              <button key={n.id} type="button" onClick={() => !n.read && markNotificationAsRead(n.id)} className={`w-full text-right rounded-lg p-2 ${n.read ? 'bg-slate-100' : 'bg-primary-100 border border-primary-300'}`}>
                <p className="text-xs font-bold">{n.title}</p>
                <p className="text-[11px] text-slate-600">{n.body}</p>
              </button>
            ))}
          </div>
          {bookings.length === 0 && <p className="text-slate-500 text-sm">لا توجد حجوزات حالياً.</p>}
          {bookings.map(b => (
            <button key={b.id} type="button" onClick={() => setSelectedId(b.id)} className={`w-full text-right border rounded-xl p-3 ${selected?.id === b.id ? 'border-primary-500 bg-primary-50/40' : 'border-slate-200'}`}>
              <p className="font-bold">{b.name} - {b.phone}</p>
              <p className="text-xs text-slate-500">{b.day} | {b.slot} | {b.status || 'new'}</p>
            </button>
          ))}
        </div>

        <div className="card p-4 space-y-4 lg:col-span-2">
          {!selected && <p className="text-slate-500">اختر حجزًا للعرض.</p>}
          {selected && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="btn-primary" onClick={() => updateServiceBooking(selected.id, { status: 'confirmed' })}>تأكيد الحجز</button>
                <button className="btn-ghost" onClick={() => updateServiceBooking(selected.id, { paymentStatus: 'paid' })}>تأكيد الدفع</button>
                <button className="btn-danger" onClick={() => updateServiceBooking(selected.id, { status: 'cancelled' })}>إلغاء</button>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 max-h-80 overflow-auto space-y-2">
                {messages.map(m => (
                  <div key={m.id} className={`p-2 rounded-lg text-sm ${m.sender === 'admin' ? 'bg-primary-100 mr-10' : 'bg-slate-100 ml-10'}`}>
                    <p className="font-semibold mb-1">{m.sender === 'admin' ? 'الإدارة' : 'العميل'}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب ردك للعميل" />
                <button className="btn-primary" onClick={send}>إرسال</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
