import { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLS } from '../firebase/collections'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''
const ADMIN_SESSION_KEY = 'elfarouk_admin_session'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: Check logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        const usersRef = collection(db, COLS.USERS)
        const snap = await getDocs(usersRef)

        // Seed default Admin if no users exist
        if (snap.empty) {
          const defaultAdmin = { pin: '0000', name: 'المدير العام', role: 'admin' }
          await addDoc(usersRef, defaultAdmin)
          toast.success('تمت تهيئة حساب المدير. الرمز الافتراضي: 0000', { duration: 6000 })
        }

        const savedAdminSession = localStorage.getItem(ADMIN_SESSION_KEY)
        if (savedAdminSession === '1' && ADMIN_EMAIL && ADMIN_PASSWORD) {
          setCurrentUser({
            id: 'admin-auth',
            name: 'المدير العام',
            role: 'admin',
            email: ADMIN_EMAIL,
          })
          setLoading(false)
          return
        }

        const savedPin = localStorage.getItem('elfarouk_session_pin')
        if (savedPin) {
          await attemptLogin(savedPin, false) // false means don't show success toast on auto-login
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth Init Error:', err)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const attemptLogin = async (pin, showToast = true) => {
    setLoading(true)
    try {
      const q = query(collection(db, COLS.USERS), where('pin', '==', pin))
      const snap = await getDocs(q)
      
      if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setCurrentUser(userData)
        localStorage.setItem('elfarouk_session_pin', pin)
        if (showToast) toast.success(`مرحباً بك، ${userData.name}!`)
        return true
      } else {
        if (showToast) toast.error('رمز الدخول غير صحيح!')
        setCurrentUser(null)
        localStorage.removeItem('elfarouk_session_pin')
        return false
      }
    } catch (e) {
      if (showToast) toast.error('خطأ في الاتصال بقاعدة البيانات')
      setCurrentUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }

  const attemptAdminLogin = async (email, password) => {
    setLoading(true)
    try {
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        toast.error('حساب الأدمن غير مهيأ للإنتاج. راجع إعدادات البيئة')
        return false
      }

      const validEmail = String(email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
      const validPassword = String(password || '') === ADMIN_PASSWORD
      if (!validEmail || !validPassword) {
        toast.error('بيانات دخول الأدمن غير صحيحة')
        return false
      }

      setCurrentUser({
        id: 'admin-auth',
        name: 'المدير العام',
        role: 'admin',
        email: ADMIN_EMAIL,
      })
      localStorage.setItem(ADMIN_SESSION_KEY, '1')
      localStorage.removeItem('elfarouk_session_pin')
      toast.success('تم تسجيل دخول الأدمن بنجاح')
      return true
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('elfarouk_session_pin')
    localStorage.removeItem(ADMIN_SESSION_KEY)
    toast('تم تسجيل الخروج', { icon: '👋' })
  }

  const value = {
    currentUser,
    loading,
    attemptLogin,
    attemptAdminLogin,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
