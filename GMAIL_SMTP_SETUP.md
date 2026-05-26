# Gmail SMTP Setup

This project now sends customer verification codes by email.

The email verification flow uses:

- `POST /api/customer-auth-request-code`
- `POST /api/customer-auth-verify-code`

It requires SMTP settings on the server side.

## Recommended option: Gmail + App Password

Use a dedicated Gmail account for system emails, for example:

- `elfarouk.service@gmail.com`

Do not use your personal Gmail directly if you can avoid it.

## 1) Turn on 2-Step Verification

In the Google account that will send emails:

1. Open Google Account settings.
2. Go to `Security`.
3. Turn on `2-Step Verification`.

## 2) Create an App Password

After enabling 2-Step Verification:

1. Go to Google Account -> `Security`.
2. Open `App passwords`.
3. Create a new app password.
4. Copy the generated 16-character password.

Use that app password as `SMTP_PASS`.

## 3) Local development setup

Add these values to `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-account@gmail.com
SMTP_FROM_NAME=ELFAROUK Service
```

Keep `.env.local` private and never commit it.

## 4) Production setup on Vercel

Add the same variables in:

- Vercel -> Project -> Settings -> Environment Variables

Required keys:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_FROM_NAME`

Recommended Gmail values:

- `SMTP_HOST = smtp.gmail.com`
- `SMTP_PORT = 587`
- `SMTP_SECURE = false`

If you prefer SSL directly, you can use:

- `SMTP_PORT = 465`
- `SMTP_SECURE = true`

## 5) What success looks like

When SMTP is configured correctly:

1. Customer opens `/customer/login?mode=register`
2. Enters:
   - name
   - email
   - phone
3. Clicks `إرسال كود التحقق`
4. Email arrives with a 6-digit code
5. Customer enters code + password
6. Account is created and signed in

## 6) Common failure messages

### `إرسال الإيميل غير مفعّل بعد. أضف إعدادات SMTP أولًا.`

At least one SMTP variable is missing.

### `Invalid login`

Usually means Gmail username/app password is incorrect.

### Timeout or no message received

Check:

- app password is correct
- Gmail account still has 2-Step Verification enabled
- spam/junk inbox
- `SMTP_FROM` matches the sender account

## 7) Suggested test

After adding SMTP values:

1. Run the app with the serverless API environment available.
2. Open `/customer/login?mode=register`
3. Use a real inbox you can access.
4. Confirm the code email arrives.
5. Complete registration.
6. Log out and log back in with the same email/password.
