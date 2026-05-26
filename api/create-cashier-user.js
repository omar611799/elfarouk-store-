import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'

const CASHIER_ROLE = 'cashier'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '')
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

function normalizeText(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeEmail(value) {
  return normalizeText(value, 120).toLowerCase()
}

function normalizePassword(value) {
  return String(value || '').trim()
}

function mapCreateError(error) {
  switch (error?.code) {
    case 'auth/email-already-exists':
      return { status: 409, message: 'هذا البريد مستخدم بالفعل' }
    case 'auth/invalid-email':
      return { status: 400, message: 'البريد الإلكتروني غير صحيح' }
    case 'auth/invalid-password':
    case 'auth/weak-password':
      return { status: 400, message: 'كلمة المرور يجب ألا تقل عن 6 أحرف' }
    default:
      return { status: 500, message: error?.message || 'تعذر إنشاء حساب الكاشير' }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let createdUser = null

  try {
    const token = getBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(token)
    const actorSnap = await db.collection('users').doc(decoded.uid).get()
    const actorRole = actorSnap.exists ? actorSnap.data().role : null

    if (actorRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const name = normalizeText(req.body?.name, 80)
    const email = normalizeEmail(req.body?.email)
    const password = normalizePassword(req.body?.password)

    if (!name) {
      return res.status(400).json({ error: 'الاسم مطلوب' })
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' })
    }

    createdUser = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    })

    await db.collection('users').doc(createdUser.uid).set({
      name,
      email,
      role: CASHIER_ROLE,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    return res.status(201).json({
      ok: true,
      user: {
        uid: createdUser.uid,
        name,
        email,
        role: CASHIER_ROLE,
      },
    })
  } catch (error) {
    if (createdUser?.uid) {
      try {
        await getAdminAuth().deleteUser(createdUser.uid)
      } catch (rollbackError) {
        console.error('Cashier creation rollback failed', rollbackError)
      }
    }

    const mapped = mapCreateError(error)
    return res.status(mapped.status).json({ error: mapped.message })
  }
}
