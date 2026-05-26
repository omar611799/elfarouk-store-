import { createHash } from 'node:crypto'
import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VERIFICATION_COLLECTION = 'customerEmailVerifications'
const MAX_ATTEMPTS = 5

function normalizeText(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeDigits(value) {
  return String(value || '').replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 1632))
}

function normalizePhone(value) {
  return normalizeDigits(value).replace(/\D/g, '').slice(0, 15)
}

function normalizeEmail(value) {
  return normalizeText(value, 120).toLowerCase()
}

function normalizeCode(value) {
  return normalizeDigits(value).slice(0, 6)
}

function hashCode(email, code) {
  return createHash('sha256').update(`${email}:${code}`).digest('hex')
}

async function findCustomerByPhone(db, phone) {
  const [userSnap, accountSnap] = await Promise.all([
    db.collection('users').where('phone', '==', phone).limit(1).get(),
    db.collection('customerAccounts').where('phone', '==', phone).limit(1).get(),
  ])

  return !userSnap.empty || !accountSnap.empty
}

async function findUserByEmail(auth, email) {
  try {
    return await auth.getUserByEmail(email)
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return null
    }
    throw error
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let createdUser = null

  try {
    const email = normalizeEmail(req.body?.email)
    const code = normalizeCode(req.body?.code)
    const password = String(req.body?.password || '').trim()

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })
    }

    if (code.length !== 6) {
      return res.status(400).json({ error: 'اكتب كود التحقق المكون من 6 أرقام' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const verificationRef = db.collection(VERIFICATION_COLLECTION).doc(email)
    const verificationSnap = await verificationRef.get()

    if (!verificationSnap.exists) {
      return res.status(404).json({ error: 'اطلب كود تحقق جديد أولًا' })
    }

    const verification = verificationSnap.data() || {}
    const now = Date.now()

    if (Number(verification.expiresAtMs || 0) < now) {
      await verificationRef.delete()
      return res.status(410).json({ error: 'انتهت صلاحية الكود. اطلب كودًا جديدًا' })
    }

    if (Number(verification.attempts || 0) >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'تم تجاوز عدد المحاولات. اطلب كودًا جديدًا' })
    }

    const expectedHash = verification.codeHash || ''
    const providedHash = hashCode(email, code)

    if (!expectedHash || expectedHash !== providedHash) {
      await verificationRef.update({
        attempts: Number(verification.attempts || 0) + 1,
        updatedAt: adminTimestamp(),
      })
      return res.status(400).json({ error: 'كود التحقق غير صحيح' })
    }

    const name = normalizeText(verification.name, 80)
    const phone = normalizePhone(verification.phone)

    if (!name || phone.length < 10) {
      return res.status(400).json({ error: 'بيانات التسجيل غير مكتملة. اطلب كودًا جديدًا' })
    }

    const [existingUser, phoneTaken] = await Promise.all([
      findUserByEmail(auth, email),
      findCustomerByPhone(db, phone),
    ])

    if (existingUser) {
      await verificationRef.delete()
      return res.status(409).json({ error: 'هذا البريد مسجل بالفعل' })
    }

    if (phoneTaken) {
      await verificationRef.delete()
      return res.status(409).json({ error: 'رقم الهاتف مسجل بالفعل' })
    }

    createdUser = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
      disabled: false,
    })

    const batch = db.batch()

    batch.set(db.collection('users').doc(createdUser.uid), {
      role: 'customer',
      name,
      phone,
      email,
      phoneVerificationStatus: 'pending',
      phoneVerificationReason: '',
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    batch.set(db.collection('customerAccounts').doc(createdUser.uid), {
      uid: createdUser.uid,
      name,
      phone,
      email,
      status: 'pending_phone_verification',
      reviewReason: '',
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    batch.delete(verificationRef)

    await batch.commit()

    return res.status(201).json({
      ok: true,
      user: {
        uid: createdUser.uid,
        name,
        email,
        phone,
        role: 'customer',
        phoneVerificationStatus: 'pending',
      },
    })
  } catch (error) {
    if (createdUser?.uid) {
      try {
        await getAdminAuth().deleteUser(createdUser.uid)
      } catch (rollbackError) {
        console.error('Customer creation rollback failed', rollbackError)
      }
    }

    return res.status(500).json({ error: error.message || 'تعذر تأكيد كود التحقق' })
  }
}
