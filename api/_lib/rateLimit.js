import { createHash } from 'node:crypto'
import { getAdminDb, adminTimestamp } from './firebaseAdmin.js'

const RATE_LIMIT_COLLECTION = '_rateLimits'

function hashKey(value) {
  return createHash('sha256').update(String(value || '')).digest('hex').slice(0, 40)
}

/**
 * Sliding-window rate limit backed by Firestore (works across serverless instances).
 * @returns {{ allowed: boolean, retryAfterSeconds?: number }}
 */
export async function checkRateLimit({ scope, identifier, maxAttempts, windowMs }) {
  const db = getAdminDb()
  const docId = hashKey(`${scope}:${identifier}`)
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(docId)
  const now = Date.now()

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)

    if (!snap.exists) {
      transaction.set(ref, {
        scope,
        count: 1,
        windowStartMs: now,
        updatedAt: adminTimestamp(),
      })
      return { allowed: true }
    }

    const data = snap.data() || {}
    const windowStartMs = Number(data.windowStartMs || 0)
    const elapsed = now - windowStartMs

    if (!windowStartMs || elapsed >= windowMs) {
      transaction.set(
        ref,
        {
          scope,
          count: 1,
          windowStartMs: now,
          updatedAt: adminTimestamp(),
        },
        { merge: true }
      )
      return { allowed: true }
    }

    const count = Number(data.count || 0)
    if (count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000)
      return { allowed: false, retryAfterSeconds }
    }

    transaction.update(ref, {
      count: count + 1,
      updatedAt: adminTimestamp(),
    })
    return { allowed: true }
  })

  return result
}

export function getClientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '')
    .split(',')[0]
    .trim()
  return forwarded || String(req.socket?.remoteAddress || 'unknown')
}
