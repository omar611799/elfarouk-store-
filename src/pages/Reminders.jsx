import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Bell, MessageCircle, Calendar, User, Car, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function Reminders() {
  const { invoices } = useStore()
  
  const allReminders = useMemo(() => {
    const list = []
    invoices.forEach(inv => {
      if (inv.customerData?.reminders?.length > 0) {
        inv.customerData.reminders.forEach(rem => {
          const date = inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000) : new Date()
          const dueDate = new Date(date)
          dueDate.setMonth(dueDate.getMonth() + (Number(rem.months) || 0))
          
          list.push({
            id: `${inv.id}-${rem.productId}`,
            customerName: inv.customerData.name,
            phone: inv.customerData.phone,
            carModel: inv.customerData.carModel,
            itemName: rem.name,
            invoiceDate: date,
            dueDate: dueDate,
            months: rem.months,
            invoiceNumber: inv.number
          })
        })
      }
    })
    
    // Sort by due date (soonest first)
    return list.sort((a, b) => a.dueDate - b.dueDate)
  }, [invoices])

  const sendReminder = (rem) => {
    const today = new Date()
    const isPast = rem.dueDate < today
    
    const msg = `السلام عليكم أ/ ${rem.customerName} 👋\n` +
      `معك الفاورق ستور لقطع غيار السيارات.\n` +
      `حبينا نفكر حضرتك بموعد صيانة/تغيير (${rem.itemName}) لسيارتك (${rem.carModel || 'المسجلة لدينا'}).\n` +
      `آخر مرة تم التغيير كانت بتاريخ ${rem.invoiceDate.toLocaleDateString('ar-EG')} والآن حان موعد المراجعة لضمان سلامتك.\n` +
      `تشرفنا بزيارتك في أي وقت 🙏`
      
    const phone = rem.phone ? rem.phone.replace(/^0/, '20') : ''
    if (!phone) return toast.error('لا يوجد رقم هاتف مسجل لهذا العميل')
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const today = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bell className="text-primary-400" /> منبهات الصيانة القادمة
        </h1>
        <span className="bg-primary-500/10 text-primary-400 px-3 py-1 rounded-full text-xs font-bold border border-primary-500/20">
          {allReminders.length} تنبيه مسجل
        </span>
      </div>

      <div className="grid gap-4">
        {allReminders.length === 0 ? (
          <div className="card py-20 text-center">
            <Clock size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">لا يوجد تنبيهات صيانة مجدولة حالياً</p>
          </div>
        ) : (
          allReminders.map((rem) => {
            const isUrgent = rem.dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
            const isPast = rem.dueDate < today

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={rem.id} 
                className={`glass-card border-l-4 ${isPast ? 'border-red-500/50' : isUrgent ? 'border-amber-500/50' : 'border-primary-500/30'} hover:bg-white/[0.04] transition-all`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPast ? 'bg-red-500/10 text-red-400' : 'bg-primary-500/10 text-primary-400'}`}>
                      {isPast ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2">
                        {rem.itemName}
                        {isPast && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-md">موعد مستحق!</span>}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <User size={14} className="text-slate-500" /> {rem.customerName}
                        </span>
                        {rem.carModel && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Car size={14} className="text-slate-500" /> {rem.carModel}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={14} className="text-slate-500" /> تم البيع في: {rem.invoiceDate.toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">تاريخ الاستحقاق</p>
                      <p className={`text-sm font-bold flex items-center gap-2 ${isPast ? 'text-red-400' : 'text-primary-400'}`}>
                        <Calendar size={14} />
                        {rem.dueDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => sendReminder(rem)}
                      className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-2xl shadow-glow transition-all flex items-center gap-2 font-bold text-sm"
                    >
                      <MessageCircle size={20} />
                      تذكير واتساب
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
