import { useStore } from '../context/StoreContext'
import { Package, Users, FileText, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function Dashboard() {
  const { products, customers, invoices, transactions } = useStore()

  const totalSales    = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const totalProfit   = invoices.reduce((s, i) => s + (i.total || 0) * 0.3, 0)
  const lowStock      = products.filter(p => p.quantity <= (p.minStock || 5))
  const totalProducts = products.length

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
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

  // Calculate active reminders
  const activeReminders = [];
  const now = new Date();
  
  invoices.forEach(inv => {
    if (!inv.customerData?.reminders) return;
    const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt);
    
    inv.customerData.reminders.forEach(rem => {
      const dueDate = new Date(invDate);
      dueDate.setMonth(dueDate.getMonth() + rem.months);
      
      const diffDays = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) { // Alert within a week
        activeReminders.push({
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
  activeReminders.sort((a, b) => a.diffDays - b.diffDays);

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'صافي الأرباح',    value: `${totalProfit.toLocaleString()} ج.م`, icon: ShoppingCart, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
    { label: 'قطع الغيار',      value: totalProducts, icon: Package, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'العملاء',         value: customers.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ]

  const sendReminderWhatsApp = (rem) => {
    const msg = `أهلاً بك يا أستاذ ${rem.customerName}\n` +
      `معك "الفاروق ستور" لقطع غيار السيارات 🚗\n` +
      `نود تذكيرك بأن موعد تغيير (${rem.productName}) لسيارتك قد حان للحفاظ على أداء سيارتك بأفضل حال.\n` +
      `نتشرف بزيارتك في أي وقت! 🙏`;
    const phone = rem.customerPhone ? rem.customerPhone.replace(/^0/, '20') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <>
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/dashboard-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[4px]" />
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-wide">لوحة التحكم</h1>
        <p className="text-slate-400 text-sm">مرحباً، إليك نظرة عامة على أداء المتجر</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map(s => (
          <motion.div whileHover={{ y: -4 }} key={s.label} className="glass-card flex flex-col items-center text-center relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-50 ${s.bg}`} />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border shadow-sm transition-transform group-hover:scale-110 ${s.bg}`}>
              <s.icon size={24} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={item} className="glass-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
        <h2 className="font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-400" />
          المبيعات الشهرية
        </h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff' }}
                itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
              />
              <Bar dataKey="total" name="المبيعات" radius={[8, 8, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <cell key={`cell-${index}`} fill={`url(#colorPv)`} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Active Reminders Logbook */}
        <motion.div variants={item} className="glass border-fuchsia-500/20 bg-fuchsia-500/[0.02] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
              <Users size={18} className="text-fuchsia-400" />
            </div>
            <h2 className="font-bold text-fuchsia-400 text-lg">تنبيهات العملاء ({activeReminders.length})</h2>
          </div>
          {activeReminders.length > 0 ? (
            <div className="space-y-2">
              {activeReminders.slice(0, 5).map(rem => (
                <div key={rem.id} className="flex flex-col gap-2 text-sm bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-xl px-4 py-3 border border-white/5 group">
                  <div>
                    <span className="text-white font-bold block">{rem.customerName}</span>
                    <span className="text-slate-400 text-xs mt-0.5 block">حان موعد تغيير: <span className="text-fuchsia-300">{rem.productName}</span></span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rem.diffDays < 0 ? 'bg-red-500/20 text-red-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                      {rem.diffDays < 0 ? `متأخر ${Math.abs(rem.diffDays)} يوم` : rem.diffDays === 0 ? 'موعده اليوم' : `متبقي ${rem.diffDays} أيام`}
                    </span>
                    <button onClick={() => sendReminderWhatsApp(rem)} className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-2 py-1 rounded-md transition-colors">مراسلة</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">لا توجد أي حجوزات أو صيانات مستحقة حالياً</p>
          )}
        </motion.div>

        {/* Low stock alert */}
        <motion.div variants={item} className="glass border-amber-500/20 bg-amber-500/[0.02] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-400" />
            </div>
            <h2 className="font-bold text-amber-400 text-lg">تنبيهات المخزون ({lowStock.length})</h2>
          </div>
          {lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-xl px-4 py-2 border border-white/5">
                  <span className="text-slate-300 font-medium">{p.name}</span>
                  <span className="badge-yellow shadow-glow">{p.quantity} قطعة</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-6">الكميات متوفرة ولا توجد نواقص</p>
          )}
        </motion.div>

        {/* Recent invoices */}
        <motion.div variants={item} className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <FileText size={18} className="text-sky-400" />
              آخر الفواتير
            </h2>
            <span className="bg-white/5 text-slate-300 text-xs px-3 py-1 rounded-full border border-white/10 font-bold">{invoices.length}</span>
          </div>
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">لا توجد فواتير بعد</p>
          ) : (
            <div className="space-y-2.5">
              {invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.06] transition-colors rounded-xl px-4 py-3 border border-white/5 group">
                  <div>
                    <p className="text-sm text-white font-bold group-hover:text-primary-400 transition-colors">{inv.customerData?.name || 'عميل'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">فاتورة #{inv.number}</p>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-emerald-400">{inv.total?.toLocaleString()} ج.م</p>
                    <span className={inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus === 'partial' ? 'badge-yellow' : 'badge-red'}>
                      {inv.paymentStatus === 'paid' ? 'مدفوع' : inv.paymentStatus === 'partial' ? 'جزئي' : 'غير مدفوع'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
    </>
  )
}
