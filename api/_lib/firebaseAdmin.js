import admin from 'firebase-admin'

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY')
  const parsed = JSON.parse(raw)
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }
  return parsed
}

export function getAdminDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
    })
  }
  return admin.firestore()
}

export const adminTimestamp = () => admin.firestore.FieldValue.serverTimestamp()
