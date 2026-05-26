import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { fetchPublicQuote } from '../services/publicRecordsApi'

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'ELFAROUK Service'

function isNotFoundError(error) {
  return /not found/i.test(String(error?.message || ''))
}

function toDateValue(value) {
  if (typeof value === 'number') return value
  if (value?.toDate) return value.toDate().getTime()

  const parsed = Date.parse(String(value || ''))
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export default function QuotePrint() {
  const { id } = useParams()
  const { quotes } = useStore()
  const { currentUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const printedRef = useRef(false)
  const [publicQuote, setPublicQuote] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const storeQuote = useMemo(
    () => quotes.find((quoteItem) => quoteItem.id === id) || null,
    [quotes, id]
  )
  const quote = storeQuote || publicQuote

  useEffect(() => {
    let cancelled = false

    if (storeQuote) {
      setPublicQuote(null)
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
        const nextQuote = await fetchPublicQuote(id)
        if (cancelled) return

        setPublicQuote(nextQuote)
        setErrorMessage('')
        setStatus(nextQuote ? 'ready' : 'not-found')
      } catch (error) {
        if (cancelled) return

        setErrorMessage(String(error?.message || 'Failed to load quote'))
        setStatus(isNotFoundError(error) ? 'not-found' : 'error')
      }
    }, delayMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [authLoading, currentUser?.role, id, storeQuote])

  useEffect(() => {
    if (quote && !printedRef.current) {
      printedRef.current = true
      document.title = `عرض سعر - ${quote.number}`
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [quote])

  if (!quote) {
    if (status === 'loading') {
      return <div className="p-10 text-center text-white">جاري التحميل...</div>
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md text-center text-white space-y-4">
          <h1 className="text-3xl font-black">تعذر تحميل عرض السعر</h1>
          <p className="text-sm leading-7 text-slate-400">
            {status === 'not-found'
              ? 'هذا العرض غير موجود أو أن الرابط غير صحيح.'
              : errorMessage || 'الرابط العام غير متاح حاليًا.'}
          </p>
          <button onClick={() => navigate(-1)} className="btn-primary px-6 py-3 rounded-2xl">
            رجوع
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0" dir="rtl">
      <div className="max-w-2xl mx-auto border border-gray-300 p-8 print:border-none print:p-0">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-extrabold tracking-widest uppercase mb-2">{BRAND_NAME}</h1>
          <h2 className="text-xl font-bold text-gray-600">بيان عرض سعر</h2>
          <p className="text-sm mt-2 text-gray-500">مقدم من ELFAROUK Service</p>
        </div>

        <div className="flex justify-between mb-8 text-sm font-semibold">
          <div>
            <p>
              رقم العرض: <span className="font-normal">{quote.number}</span>
            </p>
            <p>
              التاريخ:{' '}
              <span className="font-normal">
                {new Date(toDateValue(quote.createdAt)).toLocaleDateString('en-GB')}
              </span>
            </p>
          </div>
          <div className="text-left">
            <p>
              السيد /{' '}
              <span className="font-normal text-lg">{quote.customerData?.name || 'مجهول'}</span>
            </p>
            {quote.customerData?.carModel && (
              <p>
                طراز السيارة: <span className="font-normal">{quote.customerData.carModel}</span>
              </p>
            )}
            {quote.customerData?.phone && (
              <p>
                الهاتف:{' '}
                <span className="font-normal" dir="ltr">
                  {quote.customerData.phone}
                </span>
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-400">
              <th className="py-2 px-1 text-right w-12 border border-gray-300">م</th>
              <th className="py-2 px-2 text-right border border-gray-300">الصنف / البيان</th>
              <th className="py-2 px-2 text-center w-20 border border-gray-300">الكمية</th>
              <th className="py-2 px-2 text-center w-24 border border-gray-300">السعر</th>
              <th className="py-2 px-2 text-center w-28 border border-gray-300">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-2 px-1 text-center border font-bold text-gray-500">
                  {index + 1}
                </td>
                <td className="py-2 px-2 border">{item.name}</td>
                <td className="py-2 px-2 text-center border">{item.qty}</td>
                <td className="py-2 px-2 text-center border">
                  {Number(item.price).toLocaleString('en-US')}
                </td>
                <td className="py-2 px-2 text-center border font-bold">
                  {(item.price * item.qty).toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-1/2 bg-gray-50 p-4 border-2 border-black rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>الإجمالي الكلي:</span>
              <span>{Number(quote.total).toLocaleString('en-US')} ج.م</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-xs text-gray-500 space-y-2 border-t border-gray-300 pt-4">
          <p className="font-bold whitespace-pre-wrap">
            هذا العرض أسعاره مجرد تسعيرة مبدئية ولا تمثل فاتورة ضريبية رسمية.
          </p>
          <p>شكراً لتعاملكم مع {BRAND_NAME}. نتشرف بخدمتكم دائماً.</p>
        </div>

        <div className="mt-10 flex justify-center print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-lg"
          >
            رجوع للبرنامج
          </button>
        </div>
      </div>
    </div>
  )
}
