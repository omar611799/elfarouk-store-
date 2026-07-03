import { auth } from '../firebase/config'

export async function sendCustomerAdminNotification(payload) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('يجب تسجيل الدخول أولًا')
  }

  const response = await fetch('/api/customer-admin-notification', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({
      type: payload.type,
      bookingId: payload.bookingId,
      title: payload.title,
      body: payload.body,
    }),
  })

  const contentType = response.headers.get('content-type') || ''
  const payloadJson = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(payloadJson?.error || 'تعذر إرسال الإشعار')
  }

  return payloadJson
}
