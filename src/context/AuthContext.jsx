/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)
const STAFF_ROLES = new Set(['admin', 'cashier'])

/**
 * Validates password strength (min 6 chars, recommended 8+ with mixed case/numbers)
 */
export function validatePasswordStrength(pwd = '') {
  if (!pwd || pwd.length < 6) {
    return { valid: false, message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }
  }
  return { valid: true }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Rate Limiting on Login (Brute-Force Protection)
  const failedAttemptsRef = useRef(0)
  const lockUntilRef = useRef(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setCurrentUser(null)
          return
        }

        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        const profile = snap.exists() ? snap.data() : {}
        setCurrentUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: profile.name || fbUser.email || 'User',
          phone: profile.phone || '',
          role: profile.role || 'customer',
          phoneVerificationStatus: profile.phoneVerificationStatus || 'verified',
          phoneVerificationReason: profile.phoneVerificationReason || '',
          phoneVerifiedAt: profile.phoneVerifiedAt || null,
          phoneVerifiedByUid: profile.phoneVerifiedByUid || '',
          phoneVerifiedByName: profile.phoneVerifiedByName || '',
          accountStatusUpdatedAt: profile.accountStatusUpdatedAt || null,
          accountStatusUpdatedByUid: profile.accountStatusUpdatedByUid || '',
          accountStatusUpdatedByName: profile.accountStatusUpdatedByName || '',
        })
      } catch (error) {
        console.error('Auth load profile error', error)
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const attemptAdminLogin = async (email, password) => {
    const now = Date.now()
    if (lockUntilRef.current > now) {
      const waitSeconds = Math.ceil((lockUntilRef.current - now) / 1000)
      toast.error(`تم حظر المحاولات مؤقتاً بسبب تكرار الخطأ. انتظر ${waitSeconds} ثانية.`)
      return false
    }

    setLoading(true)
    try {
      const cleanEmail = String(email || '').trim().toLowerCase()
      const cleanPassword = String(password || '')

      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      const role = snap.exists() ? snap.data().role : null

      if (!STAFF_ROLES.has(role)) {
        await signOut(auth)
        toast.error('هذا الحساب لا يملك صلاحية الدخول الإداري')
        return false
      }

      // Reset brute-force counter on success
      failedAttemptsRef.current = 0
      lockUntilRef.current = 0
      return true
    } catch (err) {
      failedAttemptsRef.current += 1
      if (failedAttemptsRef.current >= 5) {
        lockUntilRef.current = Date.now() + 30000 // Lock for 30s
        toast.error('تم تجاوز الحد المسموح من المحاولات الخاطئة. تم القفل لمدة 30 ثانية.')
      } else {
        toast.error('بيانات دخول الإدارة غير صحيحة')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await signOut(auth)
    toast('تم تسجيل الخروج')
  }

  const value = useMemo(() => ({
    currentUser,
    loading,
    attemptAdminLogin,
    logout,
  }), [currentUser, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
