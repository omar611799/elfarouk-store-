import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { 
  Package, Users, FileText, TrendingUp, AlertTriangle, 
  ShoppingCart, ArrowUpRight, ArrowDownRight, PackageCheck, 
  History, Star, Info, MoreVertical, Download
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area 
} from 'recharts'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const { products, customers, invoices, expenses } = useStore()

  // --- Logic & Calculations ---
  const totalSales    = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
  const lowStock      = products.filter(p => p.quantity <= (p.minStock || 5))
  
  // Profit Calculation
  const totalProfit = useMemo(() => {
    return invoices.reduce((s, i) => {
      const invoiceProfit = (i.items || []).reduce((sum, item) => {
        const cost = (item.cost && item.cost > 0) ? item.cost : (item.price * 0.7)
        return sum + (item.price - cost) * (item.qty || 1)
      }, 0)
      return s + invoiceProfit
    }, 0) - totalExpenses
  }, [invoices, totalExpenses])

  // Chart Data (Last 7 days)
  const salesHistory = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('ar-EG', { weekday: 'short' });
      const daySales = invoices
        .filter(inv => {
          const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
          return invDate.toDateString() === date.toDateString()
        })
        .reduce((s, inv) => s + (inv.total || 0), 0);
      data.push({ day: label, sales: daySales });
    }
    return data;
  }, [invoices])

  // Sparkline Generic Data
  const sparklineData = [
    { v: 400 }, { v: 300 }, { v: 600 }, { v: 500 }, { v: 800 }, { v: 700 }, { v: 900 }
  ];

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="space-y-8"
    >
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-display">مرحباً بك في AutoPartsPro</h1>
          <p className="text-slate-500 text-sm font-semibold">إدارة ذكية لمنظومة "الفاروق ستور" - الإصدار الثالث</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !bg-white border-slate-200 shadow-sm flex items-center gap-2">
            <Download size={16} /> استخراج تقرير
          </button>
          <button className="btn-primary shadow-orange-500/20">
            <ShoppingCart size={18} /> بيع سريع
          </button>
        </div>
      </div>

      {/* --- Top Metric Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="إجمالي المنتجات" 
          value={products.length.toLocaleString()} 
          icon={Package} 
          trend="+12%" 
          color="orange"
          data={sparklineData}
        />
        <StatCard 
          label="نواقص المخزون" 
          value={lowStock.length} 
          icon={AlertTriangle} 
          trend="عالي" 
          color="rose"
          data={[{v:10}, {v:5}, {v:15}, {v:8}, {v:12}]}
        />
        <StatCard 
          label="إجمالي المبيعات" 
          value={`${totalSales.toLocaleString()} ج.م`} 
          icon={TrendingUp} 
          trend="+8.5%" 
          color="emerald"
          data={sparklineData}
        />
        <StatCard 
          label="صافي الربح" 
          value={`${totalProfit.toLocaleString()} ج.م`} 
          icon={PackageCheck} 
          trend="+5%" 
          color="sky"
          data={sparklineData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Sales Chart */}
        <motion.div variants={item} className="lg:col-span-2 card !p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 font-display">تحليل المبيعات</h2>
              <p className="text-xs text-slate-400 font-bold">معدل النمو خلال الأسبوع الأخير</p>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-xs font-bold">آخر 7 أيام</button>
               <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold">شهري</button>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#f97316', fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stock Status List */}
        <motion.div variants={item} className="card !p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 font-display">حالة المخزون</h2>
            <MoreVertical size={16} className="text-slate-400" />
          </div>
          
          <div className="flex-1 space-y-4">
            {lowStock.length > 0 ? lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-orange-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{p.sku || 'بدون SKU'}</p>
                </div>
                <div className="text-left">
                  <span className="text-rose-600 font-black text-sm">{p.quantity}</span>
                  <p className="text-[9px] text-slate-400 font-bold">باقي</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <PackageCheck size={48} className="mb-2" />
                <p className="text-xs font-bold">المخزن بحالة ممتازة</p>
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">
            عرض كل النواقص
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Activities */}
         <motion.div variants={item} className="card !p-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <History size={20} className="text-indigo-600" />
               </div>
               <h2 className="text-lg font-black text-slate-800 font-display">آخر العمليات</h2>
            </div>
            <div className="space-y-4">
               {invoices.slice(0, 5).map(inv => (
                 <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 grow">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <ShoppingCart size={14} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800">{inv.customerData?.name || 'عميل نقدي'}</p>
                          <p className="text-[10px] text-slate-400 font-bold">فاتورة #{inv.number}</p>
                       </div>
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-slate-800">{inv.total?.toLocaleString()} ج.م</p>
                       <p className="text-[10px] text-emerald-500 font-bold uppercase">{inv.paymentStatus === 'paid' ? 'مدفوع' : 'جزئي'}</p>
                    </div>
                 </div>
               ))}
            </div>
         </motion.div>

         {/* Most Sold */}
         <motion.div variants={item} className="card !p-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-amber-600" />
               </div>
               <h2 className="text-lg font-black text-slate-800 font-display">الأكثر مبيعاً</h2>
            </div>
            <div className="space-y-5">
               {products.slice(0, 4).map((p, idx) => (
                 <div key={p.id} className="flex items-center justify-between grow">
                    <div className="flex items-center gap-4">
                       <div className="relative">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300">
                             <Package size={24} />
                          </div>
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">{idx+1}</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{p.category || 'بدون فئة'}</p>
                       </div>
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-slate-800">{p.price?.toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span></p>
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className={`h-full bg-orange-500`} style={{ width: `${80 - idx*15}%` }} />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </motion.div>
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, icon: Icon, trend, color, data }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100'
  }

  const isUp = trend?.includes('+') || trend === 'عالي'

  return (
    <motion.div variants={item} className="stat-card flex flex-col relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <h3 className="text-slate-400 text-xs font-bold mb-1">{label}</h3>
      <p className="text-2xl font-black text-slate-800 font-display mb-4">{value}</p>
      
      {/* Sparkline Simulation */}
      <div className="h-12 w-full opacity-30 mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={color === 'orange' ? '#f97316' : color === 'rose' ? '#f43f5e' : color === 'emerald' ? '#10b981' : '#0ea5e9'} 
              fill={color === 'orange' ? '#f97316' : color === 'rose' ? '#f43f5e' : color === 'emerald' ? '#10b981' : '#0ea5e9'} 
              strokeWidth={2}
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
}
