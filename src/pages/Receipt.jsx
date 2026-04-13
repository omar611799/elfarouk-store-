import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { CheckCircle2, ShieldCheck, Download, Store } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Receipt() {
  const { id } = useParams()
  const { invoices } = useStore()
  const [isSearching, setIsSearching] = useState(true)

  useEffect(() => {
    // Wait for StoreContext to fetch from Firebase
    const t = setTimeout(() => setIsSearching(false), 3000)
    return () => clearTimeout(t)
  }, [])
  
  const inv = invoices.find(i => i.id === id)

  if (!inv) {
    if (isSearching) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-400 mt-4 font-bold animate-pulse text-sm">جاري البحث عن الفاتورة الرقمية...</p>
        </div>
      )
    }
    return <Navigate to="/" />
  }

  const isPaid = inv.dueAmount === 0
  
  return (
    <div className="min-h-screen bg-slate-950 flex justify-center py-10 px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-center relative border-b-4 border-primary-500">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary-500/30 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <Store size={28} className="text-primary-400" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase">الفاروق</h1>
          <p className="text-primary-400 text-xs font-bold tracking-widest uppercase mt-1">Auto Spare Parts</p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
            <CheckCircle2 size={14} /> فاتورة إلكترونية معتمدة
          </div>
        </div>

        {/* Invoice Info */}
        <div className="px-6 py-5 bg-slate-50 border-b border-dashed border-slate-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-sm font-medium">رقم الفاتورة:</span>
            <span className="font-bold text-slate-800 text-sm">#{inv.number}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-sm font-medium">تاريخ الإصدار:</span>
            <span className="font-bold text-slate-800 text-sm">
              {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString('ar-EG') : new Date(inv.createdAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">فاتورة باسم الأستاذ:</span>
            <span className="font-extrabold text-slate-900 text-lg">{inv.customerData?.name}</span>
            {inv.customerData?.carModel && <span className="text-slate-500 text-xs">سيارة: {inv.customerData.carModel}</span>}
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-5 flex-1 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">المشتريات</h3>
          <div className="space-y-4">
            {inv.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.qty} قطعة × {Number(item.price).toLocaleString()}</p>
                </div>
                <span className="font-bold text-slate-800 text-sm">{(item.qty * item.price).toLocaleString()} ج</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-6 bg-slate-900 text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium">الإجمالي:</span>
            <span className="text-lg font-bold">{inv.total?.toLocaleString()} ج.م</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 font-medium">تم سداد:</span>
            <span className="text-emerald-400 font-bold">{inv.paidAmount?.toLocaleString()} ج.م</span>
          </div>
          
          {!isPaid && (
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
              <span className="text-rose-400 font-medium">المتبقي:</span>
              <span className="text-rose-400 font-bold text-lg">{inv.dueAmount?.toLocaleString()} ج.م</span>
            </div>
          )}

          <button onClick={() => window.print()} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
            <Download size={18} /> حفظ الفاتورة (PDF)
          </button>
          
          <div className="text-center mt-6 flex justify-center">
            <img src="/motor-icon.png" className="w-8 h-8 opacity-20 filter grayscale" alt="Logo" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
