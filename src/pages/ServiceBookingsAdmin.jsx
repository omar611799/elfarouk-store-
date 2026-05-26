import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import {
  buildPaymentReviewState,
  getServicePaymentStatusLabel,
} from '../utils/serviceBooking'

const COMPLAINTS_PHONE = '01127930685'
const PAYMENT_NUMBER = '01115329887'

function getPaymentMeta(message) {
  return {
    senderPhone: message.paymentSenderPhone || '',
    proofImage: message.paymentProofImage || '',
    proofFileName: message.paymentProofFileName || '',
  }
}

function getBookingStatusLabel(status) {
  const labels = {
    new: 'جديد',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }

  return labels[status] || 'قيد المراجعة'
}

function formatDate(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  if (!date || Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ar-EG')
}

function AdminMessageBubble({ message }) {
  const paymentMeta = getPaymentMeta(message)
  const hasPaymentProof = Boolean(paymentMeta.senderPhone || paymentMeta.proofImage)

  return (
    <div
      className={`rounded-lg p-3 text-sm ${
        message.sender === 'admin' ? 'mr-10 bg-primary-100' : 'ml-10 bg-slate-100'
      }`}
    >
      <p className="mb-1 font-semibold">{message.sender === 'admin' ? 'الإدارة' : 'العميل'}</p>
      <p>{message.text}</p>

      {hasPaymentProof && (
        <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          {paymentMeta.senderPhone && (
            <p className="text-xs font-black text-slate-700" dir="ltr">
              From: {paymentMeta.senderPhone}
            </p>
          )}
          {paymentMeta.proofImage && (
            <a href={paymentMeta.proofImage} target="_blank" rel="noreferrer" className="block">
              <img
                src={paymentMeta.proofImage}
                alt={paymentMeta.proofFileName || 'Payment proof'}
                className="max-h-72 w-full rounded-lg object-contain"
              />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function ServiceBookingsAdmin() {
  const {
    serviceBookings,
    serviceMessages,
    notifications,
    customerWallets,
    updateServiceBooking,
    addServiceMessage,
    markNotificationAsRead,
    adjustCustomerWallet,
  } = useStore()
  const [selectedId, setSelectedId] = useState('')
  const [text, setText] = useState('')
  const [walletAmount, setWalletAmount] = useState('')
  const [walletType, setWalletType] = useState('cashback')
  const [paymentReviewNote, setPaymentReviewNote] = useState('')
  const [technicianName, setTechnicianName] = useState('')

  const bookings = useMemo(() => {
    return [...serviceBookings].sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
      const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
      return db - da
    })
  }, [serviceBookings])

  const selected = bookings.find((booking) => booking.id === selectedId) || bookings[0]

  const messages = useMemo(() => {
    if (!selected?.id) return []
    return serviceMessages
      .filter((message) => message.bookingId === selected.id)
      .sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const db = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        return da - db
      })
  }, [serviceMessages, selected?.id])

  const adminNotifications = notifications.filter((notification) => notification.audience === 'admin')
  const unreadCount = adminNotifications.filter((notification) => !notification.read).length
  const selectedWallet = customerWallets.find(
    (wallet) => wallet.uid === selected?.customerAuthUid || wallet.id === selected?.customerAuthUid
  )

  const send = async () => {
    if (!selected?.id || !text.trim()) return
    await addServiceMessage({ bookingId: selected.id, sender: 'admin', text: text.trim() })
    setText('')
  }

  const applyWalletAdjustment = async () => {
    if (!selected?.customerAuthUid) return
    const amount = Number(walletAmount || 0)
    if (!amount) return

    await adjustCustomerWallet({
      uid: selected.customerAuthUid,
      amount,
      kind: walletType,
      note: `من لوحة الحجوزات - ${selected.name || selected.phone || ''}`,
    })
    setWalletAmount('')
  }

  const reviewPayment = async (action) => {
    if (!selected?.id) return

    const reviewState = buildPaymentReviewState(action, paymentReviewNote)
    await updateServiceBooking(selected.id, reviewState)

    await addServiceMessage({
      bookingId: selected.id,
      sender: 'admin',
      text:
        action === 'approve'
          ? `تمت مراجعة التحويل بنجاح.${paymentReviewNote ? ` ملاحظة: ${paymentReviewNote}` : ''}`
          : `تم رفض إثبات التحويل، يرجى إعادة الإرسال.${paymentReviewNote ? ` السبب: ${paymentReviewNote}` : ''}`,
    })

    setPaymentReviewNote('')
  }

  const assignTechnician = async () => {
    if (!selected?.id || !technicianName.trim()) return
    await updateServiceBooking(selected.id, { assignedTechnician: technicianName.trim() })
    setTechnicianName('')
    alert('تم تعيين الفني بنجاح')
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="card flex items-center justify-between p-5">
        <div>
          <h1 className="text-2xl font-black">إدارة حجوزات الصيانة</h1>
          <p className="text-sm text-slate-500">تابع الحجز والدردشة وإثباتات الدفع من مكان واحد.</p>
          <p className="mt-1 text-xs text-slate-500">
            رقم تحصيل العربون: {PAYMENT_NUMBER} (InstaPay / محفظة)
          </p>
        </div>
        <div className="text-left">
          <a href={`tel:${COMPLAINTS_PHONE}`} className="btn-ghost">
            شكاوى: {COMPLAINTS_PHONE}
          </a>
          <p className="mt-2 text-xs text-slate-500">إشعارات غير مقروءة: {unreadCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-4 lg:col-span-1">
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-bold">إشعارات الإدارة</p>
            {adminNotifications.length === 0 && (
              <p className="text-xs text-slate-500">لا توجد إشعارات</p>
            )}
            {adminNotifications.slice(0, 5).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                className={`w-full rounded-lg p-2 text-right ${
                  notification.read ? 'bg-slate-100' : 'border border-primary-300 bg-primary-100'
                }`}
              >
                <p className="text-xs font-bold">{notification.title}</p>
                <p className="text-[11px] text-slate-600">{notification.body}</p>
              </button>
            ))}
          </div>

          {bookings.length === 0 && (
            <p className="text-sm text-slate-500">لا توجد حجوزات حالياً.</p>
          )}

          {bookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => setSelectedId(booking.id)}
              className={`w-full rounded-xl border p-3 text-right ${
                selected?.id === booking.id ? 'border-primary-500 bg-primary-50/40' : 'border-slate-200'
              }`}
            >
              <p className="font-bold">
                {booking.name} - {booking.phone}
              </p>
              <p className="text-xs text-slate-500">
                {booking.day} | {booking.slot}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {getBookingStatusLabel(booking.status)} | {getServicePaymentStatusLabel(booking.paymentStatus)}
              </p>
            </button>
          ))}
        </div>

        <div className="card space-y-4 p-4 lg:col-span-2">
          {!selected && <p className="text-slate-500">اختر حجزًا للعرض.</p>}

          {selected && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <button
                  className="btn-primary"
                  onClick={() => updateServiceBooking(selected.id, { status: 'confirmed' })}
                >
                  تأكيد الحجز
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => updateServiceBooking(selected.id, { status: 'completed' })}
                >
                  إنهاء الخدمة
                </button>
                <button
                  className="btn-danger"
                  onClick={() => updateServiceBooking(selected.id, { status: 'cancelled' })}
                >
                  إلغاء
                </button>
                <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <p className="font-black text-slate-900">{getBookingStatusLabel(selected.status)}</p>
                  <p className="mt-1 text-slate-500">{getServicePaymentStatusLabel(selected.paymentStatus)}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr,0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-bold">مراجعة الدفع اليدوي</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-black text-slate-500">حالة الدفع</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {getServicePaymentStatusLabel(selected.paymentStatus)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-black text-slate-500">آخر مراجعة</p>
                        <p className="mt-2 text-sm font-black text-slate-900">
                          {selected.paymentReviewedByName || selected.paymentReviewedByUid || '-'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(selected.paymentReviewedAt)}
                        </p>
                      </div>
                    </div>

                    {selected.paymentReviewNote && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        {selected.paymentReviewNote}
                      </div>
                    )}

                    <textarea
                      className="input mt-3 min-h-28 rounded-xl"
                      placeholder="اكتب ملاحظة للمراجعة أو سبب الرفض"
                      value={paymentReviewNote}
                      onChange={(event) => setPaymentReviewNote(event.target.value)}
                    />

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <button className="btn-primary" onClick={() => reviewPayment('approve')}>
                        تمت مراجعة التحويل
                      </button>
                      <button className="btn-danger" onClick={() => reviewPayment('reject')}>
                        مرفوض - أعد الإرسال
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-bold mb-3">تعيين الفني المسؤول</p>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder="اسم الفني (مثلاً: م/ أحمد)"
                        value={technicianName}
                        onChange={(e) => setTechnicianName(e.target.value)}
                      />
                      <button className="btn-ghost" onClick={assignTechnician}>
                        تعيين
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-bold">محفظة العميل</p>
                    <p className="mt-2 text-xs text-slate-500">
                      الرصيد الحالي:{' '}
                      <span className="font-black">
                        {Number(selectedWallet?.balance || 0).toLocaleString('en-US')} ج.م
                      </span>
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <select
                        className="input"
                        value={walletType}
                        onChange={(event) => setWalletType(event.target.value)}
                      >
                        <option value="cashback">Cashback</option>
                        <option value="gift">Gift</option>
                        <option value="discount">Discount</option>
                      </select>
                      <input
                        className="input"
                        type="number"
                        placeholder="+ أو - مبلغ"
                        value={walletAmount}
                        onChange={(event) => setWalletAmount(event.target.value)}
                      />
                      <button className="btn-primary" onClick={applyWalletAdjustment}>
                        تطبيق على المحفظة
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="max-h-80 space-y-2 overflow-auto rounded-xl border border-slate-200 p-4">
                    {messages.map((message) => (
                      <AdminMessageBubble key={message.id} message={message} />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="اكتب ردك للعميل"
                    />
                    <button className="btn-primary" onClick={send}>
                      إرسال
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
