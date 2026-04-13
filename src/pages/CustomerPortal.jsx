import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Car, History, Wrench, Calendar, FileText, CheckCircle2, AlertCircle, Phone, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

export default function CustomerPortal() {
  const { phone } = useParams()
  const { invoices, customers } = useStore()
  
  const customer = useMemo(() => {
    return customers.find(c => c.phone === phone)
  }, [customers, phone])

  const history = useMemo(() => {
    const sInvoices = invoices.filter(inv => inv.customerData?.phone === phone)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return dateB - dateA
      })
    return sInvoices
  }, [invoices, phone])

  const aggregatedHistory = useMemo(() => {
    const items = []
    history.forEach(inv => {
      const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
      const dateStr = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      
      const invItems = inv.items || inv.cartItems || []
      invItems.forEach(item => {
        items.push({
          date: dateStr,
          rawDate: date,
          name: item.name,
          qty: item.qty,
          price: item.price
        })
      })
    })
    return items
  }, [history])

  if (!customer && history.length === 0) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
                <AlertCircle size={64} className="text-rose-500 mx-auto" />
                <h1 className="text-2xl font-bold text-white">عذراً، لم يتم العثور على بيانات</h1>
                <p className="text-slate-400">يرجى التأكد من رقم الهاتف الصحيح أو مراجعة المحل.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-right font-sans pb-20 overflow-x-hidden">
      {/* Premium Header */}
      <div className="relative bg-primary-600 pt-16 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-black rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden">
                <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG value={window.location.href} size={60} />
                </div>
            </div>
            <div className="flex-1 text-center md:text-right">
                <p className="text-primary-100 font-bold tracking-widest text-xs mb-2 uppercase">بوابة عملاء الفاروق ستور</p>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">مرحباً، أستاذ {customer?.name || 'العميل المميز'}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs text-white border border-white/10">
                        <Phone size={12} /> {phone}
                    </span>
                    {customer?.carModel && (
                        <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs text-white border border-white/10 uppercase font-bold">
                            <Car size={12} /> {customer.carModel}
                        </span>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#1e293b] border border-white/5 rounded-3xl p-5 shadow-2xl">
                <p className="text-slate-500 text-xs mb-1">إجمالي المشتريات</p>
                <p className="text-2xl font-black text-white">{customer?.totalSpent?.toLocaleString() || '0'} <span className="text-xs text-slate-500">ج.م</span></p>
            </div>
            <div className="bg-[#1e293b] border border-white/5 rounded-3xl p-5 shadow-2xl">
                <p className="text-slate-500 text-xs mb-1">عدد الزيارات</p>
                <p className="text-2xl font-black text-white">{customer?.invoiceCount || history.length}</p>
            </div>
            {customer?.debtTotal > 0 && (
                <div className="col-span-2 md:col-span-1 bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 shadow-2xl">
                    <p className="text-rose-400 text-xs mb-1 font-bold">المبلغ المتبقي (آجل)</p>
                    <p className="text-2xl font-black text-rose-400">{customer.debtTotal.toLocaleString()} <span className="text-xs">ج.م</span></p>
                </div>
            )}
        </div>

        {/* Timeline */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <History className="text-primary-500" /> سجل الصيانة والمشتريات
            </h2>

            <div className="space-y-8">
                {history.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Wrench size={48} className="mx-auto mb-4" />
                        <p>لا يوجد سجلات متاحة حالياً</p>
                    </div>
                ) : (
                    history.map((inv, idx) => {
                        const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
                        return (
                            <div key={idx} className="relative pr-8 border-r-2 border-primary-500/20 last:border-transparent pb-4">
                                <div className="absolute right-[-9px] top-0 w-4 h-4 rounded-full bg-primary-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                
                                <div className="flex justify-between items-center mb-4 pr-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white">
                                            {date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold">فاتورة رقم #{inv.number}</span>
                                    </div>
                                    <div className="bg-primary-500/10 text-primary-400 text-[10px] px-3 py-1 rounded-full border border-primary-500/10 font-bold">
                                        صيانة دورية
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pr-4">
                                    {(inv.items || inv.cartItems || []).map((item, i) => (
                                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                                                    <Wrench size={18} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{item.name}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">الكمية: {item.qty} قطعة</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-white">{(item.price * item.qty).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ج.م</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {inv.dueAmount > 0 && (
                                    <div className="mr-8 mt-3 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 flex items-center justify-between">
                                        <span className="text-[10px] text-rose-400 font-bold mb-1">تم دفع {inv.paidAmount?.toLocaleString()} ومتبقي عليك:</span>
                                        <span className="text-rose-500 font-black text-xs">{inv.dueAmount?.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>

        <div className="bg-primary-600/10 border border-primary-500/20 rounded-3xl p-6 text-center">
             <div className="w-12 h-12 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} className="text-primary-500" />
             </div>
             <h3 className="text-white font-bold mb-1">نتشرف بزيارتك دائماً</h3>
             <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">الفاروق ستور - أفضل قطع غيار لسيارتك بأعلى جودة وأفضل سعر</p>
             <a href="tel:01000000000" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-glow transition-all active:scale-95">
                <Phone size={16} /> اتصل بنا للاستفسار
             </a>
        </div>
      </div>
    </div>
  )
}
