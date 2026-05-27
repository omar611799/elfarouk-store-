import { useMemo } from 'react'
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
    const msg = `السلام عليكم أ/ ${rem.customerName} 👋\n` +
      `معك الفاورق ستور لقطع غيار السيارات.\n` +
      `حبينا نفكر حضرتك بموعد صيانة/تغيير (${rem.itemName}) لسيارتك (${rem.carModel || 'المسجلة لدينا'}).\n` +
      `آخر مرة تم التغيير كانت بتاريخ ${rem.invoiceDate.toLocaleDateString('en-GB')} والآن حان موعد المراجعة لضمان سلامتك.\n` +
      `تشرفنا بزيارتك في أي وقت 🙏`
      
    const phone = rem.phone ? rem.phone.replace(/^0/, '20') : ''
    if (!phone) return toast.error('لا يوجد رقم هاتف مسجل لهذا العميل')
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const today = new Date()

  return (
    <div className="space-y-6 sm:space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight font-display flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shadow-sm">
            <Bell className="text-primary-600" size={20} />
          </div>
          منبهات الصيانة القادمة
        </h1>
        
        <span className="bg-primary-50 border border-primary-100 text-primary-700 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
          {allReminders.length} تنبيه مسجل
        </span>
      </div>

      {/* Grid */}
      <div className="grid gap-4 px-1">
        {allReminders.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 py-20 text-center rounded-3xl">
            <Clock size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 font-bold text-sm">لا يوجد تنبيهات صيانة مجدولة حالياً</p>
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
                className={`bg-white border border-slate-200 border-l-4 shadow-sm rounded-2xl hover:border-slate-350 hover:shadow-md transition-all duration-350 overflow-hidden ${
                  isPast 
                    ? 'border-l-rose-500 bg-rose-50/[0.05]' 
                    : isUrgent 
                      ? 'border-l-amber-500 bg-amber-50/[0.05]' 
                      : 'border-l-primary-500 bg-primary-50/[0.02]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isPast 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : 'bg-primary-50 text-primary-600 border-primary-100'
                    }`}>
                      {isPast ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-black text-base sm:text-lg flex items-center flex-wrap gap-2">
                        {rem.itemName}
                        {isPast && (
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] px-2 py-0.5 font-bold shadow-sm">
                            موعد مستحق!
                          </span>
                        )}
                        {!isPast && isUrgent && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] px-2 py-0.5 font-bold shadow-sm">
                            قريباً جداً
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <User size={13} className="text-slate-400" /> {rem.customerName}
                        </span>
                        {rem.carModel && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                            <Car size={13} className="text-slate-400" /> {rem.carModel}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <Clock size={13} className="text-slate-400" /> تم البيع في: {rem.invoiceDate.toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">تاريخ الاستحقاق</p>
                      <p className={`text-sm font-black flex items-center gap-2 ${isPast ? 'text-rose-600' : 'text-primary-600'}`}>
                        <Calendar size={14} />
                        {rem.dueDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => sendReminder(rem)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center gap-2 font-bold text-sm"
                    >
                      <MessageCircle size={18} />
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
