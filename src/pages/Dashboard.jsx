import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { Package, Users, FileText, TrendingUp, AlertTriangle, ShoppingCart, TrendingDown, Send, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function Dashboard() {
  const { products, customers, invoices, transactions, expenses } = useStore()

  // Business Logic
  const totalSales    = invoices.reduce((s, i) => s + (i.total || 0), 0)
  
  let missingCostCount = 0
  const totalProfitRaw = invoices.reduce((s, i) => {
    if (!i.items || i.items.length === 0) {
      missingCostCount++
      return s + (i.total || 0) * 0.3
    }
    const invoiceProfit = i.items.reduce((sum, item) => {
      if (item.cost === undefined || item.cost === 0) missingCostCount++
      const cost = (item.cost !== undefined && item.cost > 0) ? item.cost : (item.price * 0.7) 
      return sum + (item.price - cost) * (item.qty || 1)
    }, 0)
    return s + invoiceProfit
  }, 0)
  
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit     = totalProfitRaw - totalExpenses
  const lowStock      = products.filter(p => p.quantity <= (p.minStock || 5))
  const totalProducts = products.length

  const chartData = useMemo(() => {
    const data = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const month = d.toLocaleString('en-US', { month: 'short' })
      const total = invoices
        .filter(inv => {
          const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
          return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()
        })
        .reduce((s, inv) => s + (inv.total || 0), 0)
      return { month, total }
    })
    return data
  }, [invoices])

  const activeReminders = useMemo(() => {
    const reminders = [];
    const now = new Date();
    
    invoices.forEach(inv => {
      // items with reminderMonths > 0
      const invItems = inv.items || inv.cartItems || [];
      const createdAtDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt);
      const invDate = isNaN(createdAtDate.getTime()) ? now : createdAtDate;

      invItems.forEach(item => {
        if (!item.reminderMonths) return;
        
        const dueDate = new Date(invDate);
        dueDate.setMonth(dueDate.getMonth() + Number(item.reminderMonths));
        
        // Calculate days remaining
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Show reminders due in 15 days or less, or already due
        if (!isNaN(diffDays) && diffDays <= 15) {
          reminders.push({
            id: `${inv.id}-${item.id}-${item.name}`,
            customerName: inv.customerData?.name || 'عميل',
            customerPhone: inv.customerData?.phone,
            productName: item.name,
            dueDate,
            diffDays
          });
        }
      });
    });
    return reminders.sort((a, b) => a.diffDays - b.diffDays);
  }, [invoices])

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString('en-US')} ج.م`, icon: ShoppingCart, color: 'text-electric-400', bg: 'bg-electric-500/10' },
    { label: 'صافي الربح',    value: `${netProfit.toLocaleString('en-US')} ج.م`,    icon: TrendingUp,   color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
    { label: 'المصاريف',     value: `${totalExpenses.toLocaleString('en-US')} ج.م`, icon: TrendingDown, color: 'text-rose-400',     bg: 'bg-rose-500/10' },
    { label: 'قطع الغيار',    value: totalProducts,                 icon: Package,      color: 'text-cyan-400',     bg: 'bg-cyan-500/10' },
  ]

  const sendReminderWhatsApp = (rem) => {
    const msg = `أهلاً بك يا أستاذ ${rem.customerName}\n` +
      `معك "الفاروق ستور" لقطع غيار السيارات 🚗\n` +
      `نود تذكيرك بأن موعد تغيير (${rem.productName}) لسيارتك قد حان.\n` +
      `نتشرف بزيارتك في أي وقت! 🙏`;
    const phone = rem.customerPhone ? rem.customerPhone.replace(/^0/, '20') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-10 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 px-1">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 font-display">
            <span className="text-glow">لوحة التحكم</span>
            <span className="badge-blue !text-[9px] !px-3 sm:py-2 tracking-tighter">بث مباشر</span>
          </h1>
          <p className="text-slate-500 mt-1 font-black uppercase tracking-[0.2em] text-[8px] sm:text-xs opacity-60">أداء المتجر الشامل لهذا اليوم</p>
        </div>
        <div className="card !py-2 !px-3 !rounded-2xl flex items-center gap-3 bg-white/[0.03] border-white/5 shrink-0 w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-1">
        {stats.map(s => (
          <motion.div whileHover={{ scale: 1.02, y: -2 }} key={s.label} className="card !p-4 sm:!p-6 group hover:border-electric-500/30 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 blur-xl rounded-full translate-x-1/2 -translate-y-1/2 ${s.bg}`} />
            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-white/5 transition-all duration-500 group-hover:scale-110 ${s.bg}`}>
              <s.icon size={20} className={`${s.color}`} />
            </div>
            <p className={`text-base sm:text-2xl lg:text-3xl font-black ${s.color} tracking-tight font-display mb-1 truncate`}>{s.value}</p>
            <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none truncate">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {missingCostCount > 0 && (
        <motion.div variants={item} className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-center gap-4 backdrop-blur-md mx-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertTriangle className="text-amber-500" size={20} />
          </div>
          <p className="text-[9px] sm:text-xs text-amber-200/80 leading-relaxed font-black uppercase">
            تبيه: يوجد <strong className="text-amber-400">{missingCostCount}</strong> منتج مباع بدون سعر تكلفة مسجل.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 px-1">
        <motion.div variants={item} className="lg:col-span-2 card border-white/5 !p-6 sm:!p-10 relative overflow-hidden flex flex-col min-h-[350px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-electric-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <h2 className="font-black text-white flex items-center gap-4 text-base sm:text-2xl font-display uppercase tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-electric-500/10 flex items-center justify-center border border-white/5 shadow-neon">
                <TrendingUp size={20} className="text-electric-400" />
              </div>
              تحليل النمو البيعي
            </h2>
          </div>

          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{ backgroundColor: '#020617', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={window.innerWidth < 640 ? 12 : 24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : 'rgba(79, 70, 229, 0.2)'} className="transition-all duration-700" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Reminders - Compact & Mobile Practical */}
        <motion.div variants={item} className="card border-fuchsia-500/10 !bg-fuchsia-500/[0.02] !p-6 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shadow-lg">
              <Calendar size={20} className="text-fuchsia-400" />
            </div>
            <h2 className="font-black text-fuchsia-300 text-lg sm:text-xl font-display tracking-tight uppercase">مواعيد الصيانة</h2>
          </div>
          
          <div className="flex-1 space-y-3 sm:space-y-4">
            {activeReminders.length > 0 ? (
              activeReminders.slice(0, 6).map(rem => (
                <div key={rem.id} className="group bg-obsidian-950/60 rounded-[1.25rem] px-4 py-3.5 border border-white/5 hover:border-fuchsia-500/30 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="min-w-0">
                      <span className="text-white font-black block text-sm sm:text-base truncate font-display mb-0.5">{rem.customerName}</span>
                      <span className="text-slate-500 text-[10px] font-black block uppercase tracking-widest truncate">{rem.productName}</span>
                    </div>
                    <span className={`text-[8px] font-display px-2.5 py-1 rounded-lg font-black uppercase tracking-widest shrink-0 ${rem.diffDays <= 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                      {rem.diffDays < 0 ? `متأخر` : rem.diffDays === 0 ? 'اليوم' : `خلال ${rem.diffDays} يوم`}
                    </span>
                  </div>
                  <button onClick={() => sendReminderWhatsApp(rem)} className="w-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-4 py-2.5 rounded-xl font-black uppercase tracking-[0.1em] hover:bg-emerald-500 transition-all hover:text-white group-active:scale-95 flex items-center justify-center gap-2">
                    <Send size={12} /> ارسال تذكير واتساب
                  </button>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-10">
                <Calendar size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">لا يوجد تنبيهات صيانة قريبة</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 px-1">
        {/* Low Stock */}
        <motion.div variants={item} className="card border-rose-500/10 !bg-rose-500/[0.02] !p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <h2 className="font-black text-rose-300 text-lg sm:text-xl font-display tracking-tight uppercase">نواقص المخزن</h2>
          </div>
          <div className="space-y-3">
            {lowStock.length > 0 ? lowStock.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-obsidian-950/60 rounded-xl px-4 py-3.5 border border-white/5 hover:border-rose-500/30 transition-all">
                <span className="text-slate-300 font-black text-sm truncate pr-4 font-display">{p.name}</span>
                <span className="bg-rose-500/10 text-rose-400 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase shrink-0 border border-rose-500/10">{p.quantity} قطعة</span>
              </div>
            )) : (
                <div className="py-10 text-center opacity-20 font-black text-[10px] uppercase tracking-widest">المخزن ممتلئ، لا نواقص حالياً</div>
            )}
          </div>
        </motion.div>

        {/* Recent Invoices - Desktop Grid / Mobile Cards */}
        <motion.div variants={item} className="card border-white/5 !p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-white text-lg sm:text-xl flex items-center gap-4 font-display uppercase tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <FileText size={20} className="text-cyan-400" />
              </div>
              أحدث المبيعات
            </h2>
          </div>
          <div className="space-y-3">
            {invoices.slice(0, 6).map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-obsidian-950/60 hover:bg-obsidian-920 transition-all rounded-xl px-4 py-4 border border-white/5 group active:scale-[0.98]">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm text-white font-black truncate group-hover:text-electric-400 transition-colors font-display mb-0.5 tracking-tight">{inv.customerData?.name || 'عمـيل نقدي'}</p>
                  <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase opacity-60">فاتورة #{inv.number}</p>
                </div>
                <div className="text-left flex flex-col items-end shrink-0">
                  <p className="text-sm font-black text-white tracking-tight font-display mb-1.5">{inv.total?.toLocaleString('en-US')} <span className="text-[10px] text-slate-500 font-normal">ج.م</span></p>
                  <span className={inv.paymentStatus === 'paid' ? 'badge-green !text-[8px] !py-0.5' : inv.paymentStatus === 'partial' ? 'badge-yellow !text-[8px] !py-0.5' : 'badge-red !text-[8px] !py-0.5'}>
                    {inv.paymentStatus === 'paid' ? 'تم الدفع' : inv.paymentStatus === 'partial' ? 'دفع جزئي' : 'آجل / مديونية'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>

  )
}
