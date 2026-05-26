import { auth } from '../firebase/config'

function normalizePayload(payload) {
  return {
    name: String(payload?.name || '').trim(),
    email: String(payload?.email || '').trim().toLowerCase(),
    password: String(payload?.password || ''),
  }
}

export async function createCashierUser(payload) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('يجب تسجيل الدخول أولًا')
  }

  const response = await fetch('/api/create-cashier-user', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(normalizePayload(payload)),
  })

  const contentType = response.headers.get('content-type') || ''
  const payloadJson = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(payloadJson?.error || 'تعذر إنشاء حساب الكاشير')
  }

  if (!payloadJson?.user) {
    throw new Error('استجابة إنشاء الكاشير غير مكتملة')
  }

  return payloadJson.user
}
