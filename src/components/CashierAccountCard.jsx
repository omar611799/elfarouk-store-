import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, Copy, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { createCashierUser } from '../services/staffApi'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildCredentialText(account) {
  return [
    `الاسم: ${account.name}`,
    `البريد: ${account.email}`,
    `كلمة المرور: ${account.password}`,
    'صفحة الدخول: /admin-login',
  ].join('\n')
}

export default function CashierAccountCard() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [lastCreated, setLastCreated] = useState(null)

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'اكتب اسم الكاشير'
    if (!EMAIL_RE.test(String(form.email || '').trim().toLowerCase())) {
      return 'البريد الإلكتروني غير صحيح'
    }
    if (String(form.password || '').length < 6) {
      return 'كلمة المرور لا تقل عن 6 أحرف'
    }
    if (form.password !== form.confirmPassword) {
      return 'تأكيد كلمة المرور غير مطابق'
    }
    return ''
  }, [form])

  const handleFieldChange = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    setSubmitting(true)

    try {
      const createdUser = await createCashierUser(form)
      const nextAccount = {
        ...createdUser,
        password: form.password,
      }

      setLastCreated(nextAccount)
      setForm(EMPTY_FORM)
      toast.success('تم إنشاء حساب الكاشير بنجاح')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const copyCredentials = async () => {
    if (!lastCreated) return

    try {
      await navigator.clipboard.writeText(buildCredentialText(lastCreated))
      toast.success('تم نسخ بيانات الدخول')
    } catch {
      toast.error('تعذر نسخ البيانات من هذا الجهاز')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <section className="card !p-0 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-primary-600">
                Cashier Access
              </p>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-slate-900">
                <UserPlus size={20} className="text-primary-600" />
                إنشاء حساب كاشير جديد
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                أنشئ حسابًا جاهزًا لنقطة البيع من داخل النظام، ثم سلّم بيانات الدخول للموظف ليستخدم نفس
                صفحة تسجيل الدخول الإدارية.
              </p>
            </div>

            <div className="rounded-2xl bg-primary-50 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                Role
              </p>
              <p className="mt-1 text-sm font-black text-primary-800">cashier</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                الاسم
              </span>
              <div className="relative">
                <input
                  className="input pr-11"
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  placeholder="مثال: أحمد سامح"
                  autoComplete="name"
                />
                <UserPlus
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                البريد الإلكتروني
              </span>
              <div className="relative">
                <input
                  className="input pr-11"
                  dir="ltr"
                  value={form.email}
                  onChange={handleFieldChange('email')}
                  placeholder="cashier@elfarouk.com"
                  autoComplete="email"
                />
                <Mail
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                كلمة المرور المؤقتة
              </span>
              <div className="relative">
                <input
                  className="input pr-11"
                  type="password"
                  dir="ltr"
                  value={form.password}
                  onChange={handleFieldChange('password')}
                  placeholder="6 أحرف أو أكثر"
                  autoComplete="new-password"
                />
                <Lock
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                تأكيد كلمة المرور
              </span>
              <div className="relative">
                <input
                  className="input pr-11"
                  type="password"
                  dir="ltr"
                  value={form.confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  placeholder="أعد كتابة كلمة المرور"
                  autoComplete="new-password"
                />
                <ShieldCheck
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-800">صفحة الدخول المستخدمة للحساب الجديد</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                `/admin-login` ثم تحويل تلقائي إلى نقطة البيع.
              </p>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary min-w-[180px]">
              <UserPlus size={16} />
              {submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب الكاشير'}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-primary-600">
            Quick Review
          </p>
          <h3 className="mt-2 text-lg font-black text-slate-900">بعد الإنشاء مباشرة</h3>
        </div>

        <div className="space-y-3">
          {[
            'الحساب الجديد يدخل من نفس شاشة /admin-login.',
            'الدور يتسجل تلقائيًا كـ cashier في Firebase Auth و users.',
            'الكاشير يفتح نقطة البيع والمنتجات والعملاء فقط.',
          ].map((line) => (
            <div
              key={line}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-sm leading-6 text-slate-600">{line}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.6rem] border border-primary-100 bg-primary-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-600">
                Last Account
              </p>
              <h4 className="mt-1 text-base font-black text-primary-900">
                {lastCreated ? 'آخر حساب تم إنشاؤه' : 'لم يتم إنشاء حساب بعد'}
              </h4>
            </div>
            <button
              type="button"
              onClick={copyCredentials}
              disabled={!lastCreated}
              className="btn-ghost inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={15} />
              نسخ البيانات
            </button>
          </div>

          {lastCreated ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/70 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  الاسم
                </span>
                <span className="text-sm font-black text-slate-900">{lastCreated.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  البريد
                </span>
                <span className="text-sm font-black text-slate-900" dir="ltr">
                  {lastCreated.email}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  الدور
                </span>
                <span className="text-sm font-black text-slate-900">{lastCreated.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  كلمة المرور
                </span>
                <span className="text-sm font-black text-slate-900" dir="ltr">
                  {lastCreated.password}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-slate-500">
              أول حساب يتم إنشاؤه سيظهر هنا لتنسخ بياناته سريعًا قبل تسليمها للكاشير.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
