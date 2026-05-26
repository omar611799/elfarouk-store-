import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, ShieldCheck, Download, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchPublicInvoice } from '../services/publicRecordsApi'
import { toDateValue } from '../utils/customerAuth'

function isNotFoundError(error) {
  return /not found/i.test(String(error?.message || ''))
}

export default function Receipt() {
  const { id } = useParams()
  const { invoices } = useStore()
  const { currentUser, loading: authLoading } = useAuth()
  const [publicInvoice, setPublicInvoice] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const storeInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === id) || null,
    [invoices, id]
  )
  const invoice = storeInvoice || publicInvoice

  useEffect(() => {
    let cancelled = false

    if (storeInvoice) {
      setPublicInvoice(null)
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
        const nextInvoice = await fetchPublicInvoice(id)
        if (cancelled) return

        setPublicInvoice(nextInvoice)
        setErrorMessage('')
        setStatus(nextInvoice ? 'ready' : 'not-found')
      } catch (error) {
        if (cancelled) return

        setErrorMessage(String(error?.message || 'Failed to load receipt'))
        setStatus(isNotFoundError(error) ? 'not-found' : 'error')
      }
    }, delayMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [authLoading, currentUser?.role, id, storeInvoice])

  if (!invoice) {
    if (status === 'loading') {
      return (
        <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-400 mt-6 font-black animate-pulse text-[10px] uppercase tracking-[0.2em]">
            جارٍ البحث عن الفاتورة الرقمية...
          </p>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-rose-500/20 bg-rose-500/10">
            <Store size={34} className="text-rose-400" />
          </div>
          <h1 className="text-3xl font-black text-white">تعذر تحميل الفاتورة</h1>
          <p className="text-sm leading-7 text-slate-400">
            {status === 'not-found'
              ? 'لم نعثر على هذه الفاتورة أو أن الرابط غير مكتمل.'
              : errorMessage || 'الرابط العام غير متاح حاليًا من هذه البيئة.'}
          </p>
          <Link to="/" className="btn-primary inline-flex rounded-2xl px-6 py-3">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = Number(invoice.dueAmount || 0) === 0

  return (
    <div className="min-h-screen bg-obsidian-950 flex justify-center py-10 px-4 sm:py-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/5 blur-[120px] rounded-full animate-pulse-glow" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 flex flex-col border border-white/10"
      >
        <div className="bg-obsidian-900 px-6 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20 shadow-lg shadow-primary-500/10"
          >
            <Store size={32} className="text-primary-400" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight font-display">
            ELFAROUK Service
          </h1>
          <p className="text-primary-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2 opacity-60">
            Auto Spare Parts
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-500/10 uppercase tracking-widest">
            <ShieldCheck size={14} /> فاتورة موثقة
          </div>
        </div>

        <div className="bg-white px-2 py-2">
          <div className="mx-2 mt-2 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/50">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">
                  رقم الفاتورة
                </p>
                <p className="font-black text-slate-900 text-sm font-display tracking-tight">
                  #{invoice.number}
                </p>
              </div>
              <div className="text-left">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">
                  تاريخ الإصدار
                </p>
                <p className="font-black text-slate-900 text-sm font-display">
                  {new Date(toDateValue(invoice.createdAt)).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">
                العميل
              </p>
              <p className="font-black text-slate-900 text-xl font-display leading-tight">
                {invoice.customerData?.name}
              </p>
              {invoice.customerData?.carModel && (
                <p className="text-primary-600 text-[10px] font-black uppercase tracking-widest mt-1">
                  المعدات: {invoice.customerData.carModel}
                </p>
              )}
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">
                تفاصيل المشتريات
              </h3>
            </div>
            <div className="space-y-5">
              {invoice.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-sm font-display leading-tight group-hover:text-primary-600 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                      {item.qty} قطعة <span className="mx-1 opacity-30">•</span>{' '}
                      {Number(item.price).toLocaleString('en-US')} ج.م
                    </p>
                  </div>
                  <span className="font-black text-slate-900 text-sm font-display">
                    {(item.qty * item.price).toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-2 mb-2 bg-obsidian-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  المجموع الكلي
                </span>
                <span className="text-2xl font-black font-display tracking-tight">
                  {invoice.total?.toLocaleString('en-US')}{' '}
                  <span className="text-[10px] opacity-40 font-normal">ج.م</span>
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  تم سداد
                </span>
                <span className="font-black font-display">
                  {invoice.paidAmount?.toLocaleString('en-US')}{' '}
                  <span className="text-[10px] opacity-40">ج</span>
                </span>
              </div>

              {!isPaid && (
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-rose-400">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    المتبقي الآجل
                  </span>
                  <span className="text-xl font-black font-display">
                    {invoice.dueAmount?.toLocaleString('en-US')}{' '}
                    <span className="text-[10px] opacity-40">ج</span>
                  </span>
                </div>
              )}

              <div className="pt-6 space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20"
                >
                  <Download size={16} /> حفظ وتحميل (PDF)
                </button>

                {invoice.customerData?.phone && (
                  <Link
                    to={`/portal/${invoice.customerData.phone}`}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/5 text-[9px] font-black uppercase tracking-widest"
                  >
                    <CheckCircle2 size={14} className="text-primary-400" /> سجل الصيانة الخاص بك
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
            شكراً لتعاملكم معنا
          </p>
        </div>
      </motion.div>
    </div>
  )
}
