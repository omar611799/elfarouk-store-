/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)
const STAFF_ROLES = new Set(['admin', 'cashier'])

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        String(email || '').trim(),
        String(password || '')
      )
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      const role = snap.exists() ? snap.data().role : null

      if (!STAFF_ROLES.has(role)) {
        await signOut(auth)
        toast.error('هذا الحساب لا يملك صلاحية الدخول الإداري')
        return false
      }

      return true
    } catch {
      toast.error('بيانات دخول الإدارة غير صحيحة')
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
