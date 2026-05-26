import { createHash, randomInt } from 'node:crypto'
import { getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import { Resend } from 'resend' // يجب تثبيتها: npm install resend

const resend = new Resend(process.env.RESEND_API_KEY)
const VERIFICATION_COLLECTION = 'customerEmailVerifications'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, name, phone } = req.body
    if (!email || !name || !phone) return res.status(400).json({ error: 'بيانات ناقصة' })

    // توليد كود عشوائي من 6 أرقام
    const code = randomInt(100000, 999999).toString()
    const codeHash = createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex')
    
    const db = getAdminDb()
    const expiresAtMs = Date.now() + 10 * 60 * 1000 // صالح لـ 10 دقائق

    // حفظ البيانات في Firestore لمطابقتها عند الإدخال
    await db.collection(VERIFICATION_COLLECTION).doc(email.toLowerCase()).set({
      name, phone, codeHash, expiresAtMs, attempts: 0, createdAt: adminTimestamp()
    })

    // إرسال الإيميل الفعلي للعميل
    await resend.emails.send({
      from: 'ElFarouk Store <onboarding@resend.dev>',
      to: email,
      subject: `كود التحقق الخاص بك: ${code}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #225c97;">أهلاً بك في الفاروق ستور</h2>
          <p>استخدم الكود التالي لتفعيل حسابك:</p>
          <div style="background: #f1f5f9; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 10px; border-radius: 12px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px;">هذا الكود صالح لمدة 10 دقائق.</p>
        </div>
      `
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'فشل إرسال كود التحقق' })
  }
}