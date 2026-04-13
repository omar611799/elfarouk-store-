import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'الفاروق ستور'

export default function QuotePrint() {
  const { id } = useParams()
  const { quotes } = useStore()
  const navigate = useNavigate()

  const quote = quotes.find(q => q.id === id)

  useEffect(() => {
    if (quote) {
      document.title = `عرض سعر - ${quote.number}`
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [quote])

  if (!quote) return <div className="p-10 text-center text-white">جاري التحميل...</div>

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0" dir="rtl">
      {/* 
        This div is styled specifically to look good when printed.
        It uses 'print:X' tailwind utilities to adjust styles when the native browser print runs.
      */}
      <div className="max-w-2xl mx-auto border border-gray-300 p-8 print:border-none print:p-0">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-extrabold tracking-widest uppercase mb-2">{BRAND_NAME}</h1>
          <h2 className="text-xl font-bold text-gray-600">بـيـان عـرض سـعـر</h2>
          <p className="text-sm mt-2 text-gray-500">مقدم من الفاروق لقطع غيار السيارات</p>
        </div>

        <div className="flex justify-between mb-8 text-sm font-semibold">
          <div>
            <p>رقم العرض: <span className="font-normal">{quote.number}</span></p>
            <p>التاريخ: <span className="font-normal">
              {new Date(quote.createdAt?.toDate?.() || Date.now()).toLocaleDateString('ar-EG')}
            </span></p>
          </div>
          <div className="text-left">
            <p>السيد / <span className="font-normal text-lg">{quote.customerData?.name || 'مجهول'}</span></p>
            {quote.customerData?.carModel && <p>طراز السيارة: <span className="font-normal">{quote.customerData.carModel}</span></p>}
            {quote.customerData?.phone && <p>الهاتف: <span className="font-normal" dir="ltr">{quote.customerData.phone}</span></p>}
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
            {quote.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-2 px-1 text-center border font-bold text-gray-500">{idx + 1}</td>
                <td className="py-2 px-2 border">{item.name}</td>
                <td className="py-2 px-2 text-center border">{item.qty}</td>
                <td className="py-2 px-2 text-center border">{Number(item.price).toLocaleString()}</td>
                <td className="py-2 px-2 text-center border font-bold">{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-1/2 bg-gray-50 p-4 border-2 border-black rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>الإجمالي الكلي:</span>
              <span>{Number(quote.total).toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-xs text-gray-500 space-y-2 border-t border-gray-300 pt-4">
          <p className="font-bold whitespace-pre-wrap">هذا العرض أسعاره مجرد تسعيرة مبدئية ولا تمثل فاتورة ضريبية رسمية.</p>
          <p>شكراً لتعاملكم مع {BRAND_NAME}. نتشرف بخدمتكم دائماً.</p>
        </div>
        
        {/* Helper button that hides on print, just to return back easily */}
        <div className="mt-10 flex justify-center print:hidden">
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg">
                🔙 رجوع للبرنامج
            </button>
        </div>
      </div>
    </div>
  )
}
