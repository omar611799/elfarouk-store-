import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

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
          role: profile.role || 'customer',
        })
      } catch (e) {
        console.error('Auth load profile error', e)
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
      await signInWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''))
      return true
    } catch (e) {
      toast.error('بيانات دخول الأدمن غير صحيحة')
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
