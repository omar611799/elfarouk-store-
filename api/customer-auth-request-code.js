import { createHash } from 'node:crypto'
import { getAdminAuth, getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import { isMailerConfigured, sendCustomerVerificationEmail } from './_lib/mailer.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VERIFICATION_COLLECTION = 'customerEmailVerifications'
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const IP_REQUEST_LIMIT = 10
const IP_REQUEST_WINDOW_MS = 60 * 60 * 1000
const EMAIL_HOURLY_LIMIT = 5
const EMAIL_HOURLY_WINDOW_MS = 60 * 60 * 1000

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

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashCode(email, code) {
  return createHash('sha256').update(`${email}:${code}`).digest('hex')
}

function maskEmail(email) {
  const [localPart, domain] = String(email || '').split('@')
  if (!localPart || !domain) return email
  const visible = localPart.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(2, localPart.length - 2))}@${domain}`
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

  try {
    if (!isMailerConfigured()) {
      return res.status(500).json({
        error: 'إرسال الإيميل غير مفعّل بعد. أضف إعدادات SMTP أولًا.',
      })
    }

    const name = normalizeText(req.body?.name, 80)
    const email = normalizeEmail(req.body?.email)
    const phone = normalizePhone(req.body?.phone)

    if (!name) {
      return res.status(400).json({ error: 'الاسم مطلوب' })
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })
    }

    if (phone.length < 10) {
      return res.status(400).json({ error: 'رقم الهاتف غير صحيح' })
    }

    const clientIp = getClientIp(req)
    const ipLimit = await checkRateLimit({
      scope: 'customer_auth_request_ip',
      identifier: clientIp,
      maxAttempts: IP_REQUEST_LIMIT,
      windowMs: IP_REQUEST_WINDOW_MS,
    })

    if (!ipLimit.allowed) {
      return res.status(429).json({
        error: `تجاوزت عدد طلبات التحقق. حاول بعد ${ipLimit.retryAfterSeconds} ثانية`,
      })
    }

    const emailLimit = await checkRateLimit({
      scope: 'customer_auth_request_email',
      identifier: email,
      maxAttempts: EMAIL_HOURLY_LIMIT,
      windowMs: EMAIL_HOURLY_WINDOW_MS,
    })

    if (!emailLimit.allowed) {
      return res.status(429).json({
        error: `تجاوزت عدد طلبات هذا البريد. حاول بعد ${emailLimit.retryAfterSeconds} ثانية`,
      })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()

    const [existingUser, phoneTaken] = await Promise.all([
      findUserByEmail(auth, email),
      findCustomerByPhone(db, phone),
    ])

    if (existingUser) {
      return res.status(409).json({ error: 'هذا البريد مسجل بالفعل' })
    }

    if (phoneTaken) {
      return res.status(409).json({ error: 'رقم الهاتف مسجل بالفعل' })
    }

    const verificationRef = db.collection(VERIFICATION_COLLECTION).doc(email)
    const verificationSnap = await verificationRef.get()
    const now = Date.now()

    if (verificationSnap.exists) {
      const previous = verificationSnap.data() || {}
      const requestedAtMs = Number(previous.requestedAtMs || 0)
      if (requestedAtMs && now - requestedAtMs < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - requestedAtMs)) / 1000)
        return res.status(429).json({
          error: `يمكنك طلب كود جديد بعد ${retryAfter} ثانية`,
        })
      }
    }

    const code = generateCode()

    await verificationRef.set({
      name,
      email,
      phone,
      codeHash: hashCode(email, code),
      attempts: 0,
      requestedAtMs: now,
      expiresAtMs: now + CODE_TTL_MS,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    })

    await sendCustomerVerificationEmail({ to: email, name, code })

    return res.status(200).json({
      ok: true,
      email: maskEmail(email),
      expiresInSeconds: Math.floor(CODE_TTL_MS / 1000),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'تعذر إرسال كود التحقق' })
  }
}
