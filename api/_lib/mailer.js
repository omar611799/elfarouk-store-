import nodemailer from 'nodemailer'

let cachedTransporter = null

function getSmtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '').trim()
  const from = String(process.env.SMTP_FROM || user).trim()
  const fromName = String(process.env.SMTP_FROM_NAME || 'ELFAROUK Service').trim()
  const port = Number(process.env.SMTP_PORT || 587)
  const secure =
    String(process.env.SMTP_SECURE || '').trim() === 'true' || port === 465

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    fromName,
  }
}

export function isMailerConfigured() {
  const config = getSmtpConfig()
  return Boolean(config.host && config.user && config.pass && config.from)
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const config = getSmtpConfig()
  if (!isMailerConfigured()) {
    throw new Error('Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.')
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  return cachedTransporter
}

export async function sendCustomerVerificationEmail({ to, name, code }) {
  const transporter = getTransporter()
  const config = getSmtpConfig()

  const appName = config.fromName || 'ELFAROUK Service'
  const safeName = String(name || 'عميلنا').trim()
  const safeCode = String(code || '').trim()

  await transporter.sendMail({
    from: `"${appName}" <${config.from}>`,
    to,
    subject: 'كود تفعيل حسابك في ELFAROUK Service',
    text: [
      `مرحبًا ${safeName}`,
      '',
      `كود تفعيل حسابك هو: ${safeCode}`,
      'صلاحية الكود 10 دقائق.',
      'إذا لم تطلب هذا الكود، تجاهل الرسالة.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, Tahoma, sans-serif; direction: rtl; text-align: right; color: #0f172a; line-height: 1.8;">
        <h2 style="margin: 0 0 12px; color: #153d65;">ELFAROUK Service</h2>
        <p style="margin: 0 0 16px;">مرحبًا ${safeName}</p>
        <p style="margin: 0 0 12px;">كود تفعيل حسابك هو:</p>
        <div style="display: inline-block; padding: 12px 20px; border-radius: 14px; background: #eef5fb; color: #153d65; font-size: 26px; font-weight: 700; letter-spacing: 6px;">
          ${safeCode}
        </div>
        <p style="margin: 16px 0 0;">صلاحية الكود 10 دقائق.</p>
        <p style="margin: 8px 0 0; color: #64748b;">إذا لم تطلب هذا الكود، تجاهل الرسالة.</p>
      </div>
    `,
  })
}
