import admin from 'firebase-admin'

function getServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || ''

  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
    }
    return parsed
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  return null
}

function getAdminCredential() {
  const serviceAccount = getServiceAccount()
  if (serviceAccount) {
    return admin.credential.cert(serviceAccount)
  }

  try {
    return admin.credential.applicationDefault()
  } catch {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.'
    )
  }
}

function getAdminApp() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: getAdminCredential(),
    })
  }
  return admin.app()
}

export function getAdminDb() {
  return getAdminApp().firestore()
}

export function getAdminAuth() {
  return getAdminApp().auth()
}

export const adminTimestamp = () => admin.firestore.FieldValue.serverTimestamp()
