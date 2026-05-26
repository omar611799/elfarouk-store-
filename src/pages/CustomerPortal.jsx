import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { Car, History, Wrench, AlertCircle, Phone, MapPin, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { fetchPublicCustomerPortal } from '../services/publicRecordsApi'
import { normalizeCustomerPhone, normalizeCustomerDigits, toDateValue } from '../utils/customerAuth'

function isNotFoundError(error) {
  return /not found/i.test(String(error?.message || ''))
}

export default function CustomerPortal() {
  const { phone } = useParams()
  const { invoices, customers } = useStore()
  const { currentUser, loading: authLoading } = useAuth()
  const [publicPortal, setPublicPortal] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const normalizedPhone = normalizeCustomerPhone(phone)

  const isStaffOrOwner = currentUser?.role === 'admin' || normalizeCustomerPhone(currentUser?.phone) === normalizedPhone

  const storeCustomer = useMemo(
    () =>
      customers.find((customerItem) => normalizeCustomerPhone(customerItem.phone) === normalizedPhone) ||
      null,
    [customers, normalizedPhone]
  )

  const storeHistory = useMemo(() => {
    return invoices
      .filter((invoice) => normalizeCustomerPhone(invoice.customerData?.phone) === normalizedPhone)
      .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt))
  }, [invoices, normalizedPhone])

  const customer = storeCustomer || publicPortal?.customer || null
  const history = storeHistory.length > 0 ? storeHistory : publicPortal?.invoices || []

  useEffect(() => {
    let cancelled = false

    if (storeCustomer || storeHistory.length > 0) {
      setPublicPortal(null)
      setErrorMessage('')
      setStatus('ready')
      return () => {
        cancelled = true
      }
    }

    if (authLoading) {
      setStatus('loading')
      return () => {
        cancelled = true
      }
    }

    const delayMs = currentUser?.role === 'admin' ? 2500 : 0
    const timer = setTimeout(async () => {
      try {
        const nextPortal = await fetchPublicCustomerPortal(normalizedPhone)
        if (cancelled) return

        setPublicPortal(nextPortal)
        setErrorMessage('')
        setStatus(nextPortal?.customer || nextPortal?.invoices?.length ? 'ready' : 'not-found')
      } catch (error) {
        if (cancelled) return

        setErrorMessage(String(error?.message || 'Failed to load portal'))
        setStatus(isNotFoundError(error) ? 'not-found' : 'error')
      }
    }, delayMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [authLoading, currentUser?.role, normalizedPhone, storeCustomer, storeHistory.length])

  if (!customer && history.length === 0) {
    if (status === 'loading') {
      return (
        <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">
            جاري تحميل البوابة...
          </p>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle size={40} className="text-rose-500" />
          </div>
          <h1 className="text-3xl font-black text-white font-display tracking-tight">
            عذرًا، لم يتم العثور على بيانات
          </h1>
          <p className="text-slate-500 text-sm font-black uppercase tracking-widest leading-relaxed">
            {status === 'not-found'
              ? 'يرجى التأكد من رقم الهاتف الصحيح أو مراجعة المتجر لتسجيل بياناتك.'
              : errorMessage || 'تعذر تحميل البوابة من هذه البيئة.'}
          </p>
          <div className="pt-4">
            <Link to="/" className="btn-ghost !px-8 py-3 text-[10px] font-black uppercase tracking-widest">
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const totalSpent = Number(
    customer?.totalSpent || history.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
  ).toLocaleString('en-US')
  const debtTotal = Number(
    customer?.debtTotal || history.reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0)
  )
  const displayPhone = customer?.phone || normalizedPhone || phone

  return (
    <div
      className="min-h-screen bg-obsidian-950 text-right font-sans pb-20 overflow-x-hidden selection:bg-primary-500 selection:text-white"
      dir="rtl"
    >
      <div className="relative bg-obsidian-900 pt-16 pb-36 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 blur-[150px] -mr-64 -mt-64 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] -ml-40 -mb-40 rounded-full" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div
            initial={{ rotate: -5, scale: 0.95 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-28 h-28 bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-premium group overflow-hidden"
          >
            <div className="bg-white p-2.5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <QRCodeSVG value={window.location.href} size={75} />
            </div>
          </motion.div>
          <div className="flex-1 text-center md:text-right">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary-400 font-black tracking-widest text-[10px] mb-3 uppercase leading-none"
            >
              بوابة عملاء ELFAROUK Service
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white mb-6 font-display tracking-tight"
            >
              مرحبًا، أستاذ {customer?.name || 'العميل المميز'}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center md:justify-start gap-4"
            >
              <span className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-slate-300 border border-white/10 uppercase tracking-widest leading-none">
                <Phone size={14} className="text-primary-400" /> {displayPhone}
              </span>
              {customer?.carModel && (
                <span className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-slate-300 border border-white/10 uppercase tracking-widest leading-none">
                  <Car size={14} className="text-primary-400" /> {customer.carModel}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-20 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {isStaffOrOwner && <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card p-6 sm:p-8 border-white/5 bg-obsidian-920/80 backdrop-blur-3xl shadow-premium"
          >
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 font-display">
              إجمالي المشتريات
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white font-display tracking-tighter">
              {totalSpent} <small className="text-xs text-slate-500 font-normal">ج.م</small>
            </p>
          </motion.div>}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card p-6 sm:p-8 border-white/5 bg-obsidian-920/80 backdrop-blur-3xl shadow-premium"
          >
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 font-display">
              عدد الزيارات
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white font-display tracking-tighter">
              {history.length}
            </p>
          </motion.div>
          {debtTotal > 0 && isStaffOrOwner && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="col-span-2 md:col-span-1 card p-6 sm:p-8 border-rose-500/10 bg-rose-500/5 backdrop-blur-3xl shadow-premium lg:shadow-rose-500/5"
            >
              <p className="text-rose-400 text-[9px] font-black uppercase tracking-widest mb-2 font-display">
                المبلغ المتبقي (آجل)
              </p>
              <p className="text-2xl sm:text-3xl font-black text-rose-400 font-display tracking-tighter">
                {debtTotal.toLocaleString('en-US')}{' '}
                <small className="text-xs font-normal">ج.م</small>
              </p>
            </motion.div>
          )}
        </div>

        <div className="card p-6 sm:p-12 border-white/5 shadow-premium overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/[0.03] blur-[100px] pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-12 flex items-center gap-4 font-display tracking-tight">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-neon">
              <History size={24} className="text-primary-400" />
            </div>
            سجل المشتريات والصيانة
          </h2>

          <div className="space-y-10 sm:space-y-16">
            {history.length === 0 ? (
              <div className="text-center py-24 opacity-20 border border-dashed border-white/10 rounded-[2.5rem]">
                <Wrench size={56} className="mx-auto mb-6 text-slate-500" />
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.4em]">
                  لا يوجد سجلات متاحة حاليًا
                </p>
              </div>
            ) : (
              history.map((invoice, index) => {
                const date = new Date(toDateValue(invoice.createdAt))

                return (
                  <motion.div
                    key={invoice.id || index}
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="relative pr-8 sm:pr-12 border-r-2 border-white/5 pb-4"
                  >
                    <div className="absolute right-[-7px] top-0 w-3.5 h-3.5 rounded-full bg-primary-500 shadow-neon flex items-center justify-center" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pr-6">
                      <div>
                        <span className="text-base sm:text-xl font-black text-white font-display block mb-1 leading-none">
                          {date.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2 block">
                          رقم الإيصال #{invoice.number}
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-[0.2em] px-4 py-1.5 rounded-full border border-emerald-500/10 uppercase w-fit">
                        عملية موثقة
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 pr-0">
                      {(invoice.items || []).map((item, itemIndex) => (
                        <div
                          key={item.id || itemIndex}
                          className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-primary-500/20 rounded-[1.5rem] p-4 sm:p-6 flex items-center justify-between transition-all duration-300"
                        >
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-obsidian-950 border border-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                              <Wrench
                                size={18}
                                className="text-slate-500 group-hover:text-primary-400 transition-colors"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-lg font-black text-white font-display truncate leading-tight mb-1">
                                {item.name}
                              </p>
                              <p className="text-[9px] sm:text-[10px] text-slate-600 font-black uppercase tracking-widest">
                                الكمية: {item.qty} ق <span className="mx-1 opacity-20">•</span>{' '}
                                {item.price.toLocaleString('en-US')} ج
                              </p>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-sm sm:text-xl font-black text-white font-display tracking-tighter">
                              {(item.price * item.qty).toLocaleString('en-US')}{' '}
                              <small className="text-[9px] text-slate-500 font-normal pr-1 uppercase">
                                ج.م
                              </small>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {invoice.dueAmount > 0 && (
                      <div className="mt-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/10">
                            <CreditCard size={14} className="text-rose-500" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-2">
                            متبقي عليك (آجل):
                          </span>
                        </div>
                        <span className="text-rose-500 font-black text-sm sm:text-lg font-display tracking-tighter">
                          {invoice.dueAmount?.toLocaleString('en-US')} ج.م
                        </span>
                      </div>
                    )}
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        <div className="card !p-0 border-primary-500/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-8 sm:p-12 text-center relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-500/10 rounded-3xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform shadow-neon">
              <MapPin size={28} className="text-primary-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 font-display tracking-tight">
              نفتخر بخدمتكم دائمًا
            </h3>
            <p className="text-[10px] text-slate-500 max-w-xs font-black uppercase tracking-widest mb-8 leading-relaxed opacity-60">
              ELFAROUK Service - إدارة أوضح لقطع الغيار والخدمة اليومية.
            </p>
            <a
              href="tel:01127930685"
              className="inline-flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-neon transition-all active:scale-95"
            >
              <Phone size={18} /> اتصل بنا الآن
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
