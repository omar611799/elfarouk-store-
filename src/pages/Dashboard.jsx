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
      const month = d.toLocaleString('ar-EG', { month: 'short' })
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
      if (!inv.customerData?.reminders) return;
      const createdAtDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt);
      const invDate = isNaN(createdAtDate.getTime()) ? now : createdAtDate;
      inv.customerData.reminders.forEach(rem => {
        if (!rem.months) return;
        const dueDate = new Date(invDate);
        dueDate.setMonth(dueDate.getMonth() + rem.months);
        const diffDays = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
        if (!isNaN(diffDays) && diffDays <= 7) {
          reminders.push({
            id: `${inv.id}-${rem.productId}`,
            customerName: inv.customerData.name,
            customerPhone: inv.customerData.phone,
            productName: rem.name,
            dueDate,
            diffDays
          });
        }
      });
    });
    return reminders.sort((a, b) => a.diffDays - b.diffDays);
  }, [invoices])

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م`, icon: ShoppingCart, color: 'text-electric-400', bg: 'bg-electric-500/10' },
    { label: 'صافي الربح',    value: `${netProfit.toLocaleString()} ج.م`,    icon: TrendingUp,   color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
    { label: 'المصاريف',     value: `${totalExpenses.toLocaleString()} ج.م`, icon: TrendingDown, color: 'text-rose-400',     bg: 'bg-rose-500/10' },
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4 font-display">
            <span className="text-glow">لوحة التحكم</span>
            <span className="badge-blue !text-[12px] !px-4 py-2">مباشر</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-[0.2em] text-xs opacity-80">نظرة عامة على أداء المتجر اليوم</p>
        </div>
        <div className="card !p-3 !rounded-2xl flex items-center gap-3 bg-white/5 border-white/10 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <motion.div whileHover={{ scale: 1.05, y: -5 }} key={s.label} className="card group hover:border-electric-500/30">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${s.bg}`}>
              <s.icon size={32} className={`${s.color} drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]`} />
            </div>
            <p className={`text-3xl font-black ${s.color} tracking-tight font-display mb-2`}>{s.value}</p>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{s.label}</p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-electric-500/5 blur-3xl rounded-full" />
          </motion.div>
        ))}
      </motion.div>

      {missingCostCount > 0 && (
        <motion.div variants={item} className="bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-6 flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-lg">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <p className="text-sm text-amber-200/80 leading-relaxed font-medium">
            يوجد <strong className="text-amber-400 font-black">{missingCostCount}</strong> منتج مباع بدون سعر تكلفة مسجل. تم حساب الربح بشكل تقديري (٣٠٪).
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 card border-white/5 !p-10 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-electric-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-black text-white flex items-center gap-4 text-2xl font-display">
              <div className="w-10 h-10 rounded-xl bg-electric-500/10 flex items-center justify-center border border-white/10 shadow-neon">
                <TrendingUp size={22} className="text-electric-400" />
              </div>
              تحليل المبيعات
            </h2>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{ backgroundColor: '#020617', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', padding: '15px' }}
                  itemStyle={{ color: '#fff', fontWeight: 900 }}
                  labelStyle={{ color: '#64748b', marginBottom: '5px', fontSize: '10px', fontWeight: 900 }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Reminders / Logbook */}
        <motion.div variants={item} className="card border-fuchsia-500/10 !bg-fuchsia-500/[0.02]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shadow-lg">
              <Calendar size={20} className="text-fuchsia-400" />
            </div>
            <h2 className="font-black text-fuchsia-400 text-xl font-display tracking-tight">تنبيهات العملاء ({activeReminders.length})</h2>
          </div>
          {activeReminders.length > 0 ? (
            <div className="space-y-3">
              {activeReminders.slice(0, 5).map(rem => (
                <div key={rem.id} className="flex flex-col gap-3 bg-obsidian-950/40 rounded-2xl px-5 py-4 border border-white/5 hover:border-fuchsia-500/30 transition-all duration-300">
                  <div>
                    <span className="text-white font-black block text-sm">{rem.customerName}</span>
                    <span className="text-slate-500 text-[10px] mt-1 font-bold block uppercase tracking-tighter">تغيير: {rem.productName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest ${rem.diffDays < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-fuchsia-500/10 text-fuchsia-400'}`}>
                      {rem.diffDays < 0 ? `متأخر ${Math.abs(rem.diffDays)} يوم` : rem.diffDays === 0 ? 'موعده اليوم' : `متبقي ${rem.diffDays} أيام`}
                    </span>
                    <button onClick={() => sendReminderWhatsApp(rem)} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                      <Send size={12} /> مراسلة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center opacity-40">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">لا يوجد مواعد قادمة</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock */}
        <motion.div variants={item} className="card border-rose-500/10 !bg-rose-500/[0.02]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <h2 className="font-black text-rose-400 text-xl font-display tracking-tight">النواقص ({lowStock.length})</h2>
          </div>
          <div className="space-y-3">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-obsidian-950/40 rounded-2xl px-5 py-4 border border-white/5 hover:border-rose-500/30 transition-all">
                <span className="text-slate-300 font-bold">{p.name}</span>
                <span className="bg-rose-500/20 text-rose-400 text-[10px] px-3 py-1 rounded-lg font-black uppercase">{p.quantity} قطعة</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Invoices */}
        <motion.div variants={item} className="card border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-white text-xl flex items-center gap-4 font-display">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg">
                <FileText size={20} className="text-cyan-400" />
              </div>
              آخر المبيعات
            </h2>
          </div>
          <div className="space-y-3">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-obsidian-950/40 hover:bg-obsidian-900 transition-all rounded-2xl px-5 py-4 border border-white/5 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-black truncate group-hover:text-electric-400 transition-colors font-display">{inv.customerData?.name || 'عميل نقدي'}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-tighter opacity-60">#{inv.number}</p>
                </div>
                <div className="text-left flex flex-col items-end gap-2 shrink-0">
                  <p className="text-sm font-black text-emerald-400 tracking-tight">{inv.total?.toLocaleString()} <span className="text-[8px] opacity-70">ج.م</span></p>
                  <span className={inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus === 'partial' ? 'badge-yellow' : 'badge-red'}>
                    {inv.paymentStatus === 'paid' ? 'مدفوع' : inv.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوع'}
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
