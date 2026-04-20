import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, AlertOctagon, PackageX, DollarSign, Package } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}

export default function Reports() {
  const { products, invoices } = useStore()
  const [activeTab, setActiveTab] = useState('dead-stock')
  const [monthsThreshold, setMonthsThreshold] = useState(6)

  // Memoize analysis
  const analysis = useMemo(() => {
    const productStats = {}
    products.forEach(p => {
      productStats[p.id] = { id: p.id, name: p.name, category: p.category, qtySold: 0, profit: 0, lastSold: null, currentStock: p.quantity }
    })

    const thresholdDate = new Date()
    thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold)

    invoices.forEach(inv => {
      const date = inv.createdAt?.toDate?.() || new Date(inv.createdAt)
      const invItems = inv.items || inv.cartItems || [] // Compatibility
      invItems.forEach(item => {
        if (!productStats[item.id]) return
        
        const effectiveQty = item.qty - (item.returnedQty || 0);
        if (effectiveQty <= 0) return;

        productStats[item.id].qtySold += effectiveQty

        const itemCost = item.cost !== undefined ? item.cost : (products.find(p => p.id === item.id)?.cost || 0)
        productStats[item.id].profit += (item.price - itemCost) * effectiveQty
        
        if (!productStats[item.id].lastSold || date > productStats[item.id].lastSold) {
          productStats[item.id].lastSold = date
        }
      })
    })

    const allStats = Object.values(productStats)

    // Dead Stock
    const deadStock = allStats.filter(p => !p.lastSold || p.lastSold < thresholdDate).filter(p => p.currentStock > 0)
    
    // Top Selling
    const topSelling = [...allStats].sort((a, b) => b.qtySold - a.qtySold).slice(0, 10).filter(p => p.qtySold > 0)

    // Most Profitable
    const mostProfitable = [...allStats].sort((a, b) => b.profit - a.profit).slice(0, 10).filter(p => p.profit > 0)

    return { deadStock, topSelling, mostProfitable }
  }, [products, invoices, monthsThreshold])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 pb-32">
      <motion.div variants={itemVariant} className="flex flex-col gap-1 px-1">
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 font-display">
            <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-white/10 flex items-center justify-center shadow-neon">
                <BarChart3 size={20} className="text-electric-400" />
            </div>
            تقارير الذكاء والمخزون
        </h1>
        <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">حلل مبيعاتك واكتشف البضاعة الراكدة والأكثر ربحية</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariant} className="flex gap-2 bg-white/5 p-1.5 rounded-2xl w-full max-w-xl mx-auto sm:mx-0 border border-white/5">
        <button 
          onClick={() => setActiveTab('dead-stock')} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dead-stock' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          البضاعة الراكدة
        </button>
        <button 
          onClick={() => setActiveTab('top-sellers')} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'top-sellers' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          الأكثر مبيعاً
        </button>
      </motion.div>

      {activeTab === 'dead-stock' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 px-1">
          <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 font-display uppercase tracking-tight">
                <PackageX size={20} className="text-rose-400" /> تقرير الركود
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">منتجات متوفرة بالمخزن ولم تُباع منذ فترة.</p>
            </div>
            <select value={monthsThreshold} onChange={e => setMonthsThreshold(Number(e.target.value))} className="input sm:w-56 text-[10px] sm:text-xs font-black uppercase tracking-widest border-rose-500/10 focus:border-rose-500">
              <option value={1}>لم تُباع منذ شهر</option>
              <option value={3}>لم تُباع منذ 3 أشهر</option>
              <option value={6}>لم تُباع منذ 6 أشهر</option>
              <option value={12}>لم تُباع منذ سنة</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {analysis.deadStock.length === 0 ? (
              <div className="col-span-full text-center py-20 card border-dashed border-white/5 opacity-30">
                <AlertOctagon size={40} className="text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">ممتاز! لا توجد بضاعة راكدة لهذه الفترة.</p>
              </div>
            ) : (
              analysis.deadStock.map(p => (
                <motion.div key={p.id} whileHover={{ y: -4 }} className="card border-rose-500/10 hover:border-rose-500/30 transition-all relative overflow-hidden !py-4 !px-5 sm:!py-5 sm:!px-6">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl pointer-events-none" />
                  <p className="font-black text-white text-base sm:text-lg font-display tracking-tight mb-1 capitalize leading-tight">{p.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-rose-500 font-black uppercase tracking-widest mb-4">{p.lastSold ? `آخر بيع: ${p.lastSold.toLocaleDateString('en-GB')}` : 'لم تُباع أبداً'}</p>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs pt-3 border-t border-white/5">
                    <span className="text-slate-600 font-black uppercase tracking-widest leading-none">الرصيد المتاح</span>
                    <span className="font-black text-white bg-white/5 px-2 py-1 rounded-md leading-none">{p.currentStock} قطعة</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'top-sellers' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 px-1">
          {/* Top Selling */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-3 font-display uppercase tracking-tight">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/10 flex items-center justify-center shrink-0">
                <Package size={18} className="text-cyan-400" />
              </div>
              القطع الأكثر مبيعاً
            </h2>
            <div className="space-y-2.5">
                {analysis.topSelling.length === 0 ? (
                    <div className="py-10 text-center card border-dashed border-white/5 opacity-30">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا توجد بيانات حالياً</p>
                    </div>
                ) : (
                    analysis.topSelling.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card flex items-center gap-4 !py-3 !px-4 hover:border-cyan-500/20 group">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-[10px] shrink-0 border border-cyan-500/10 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm truncate font-display mb-0.5">{p.name}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest truncate">{p.category || 'بدون فئة'}</p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-base font-black text-cyan-400 font-display leading-none">{p.qtySold}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase mt-1 tracking-widest">قطعة</p>
                          </div>
                        </motion.div>
                      ))
                )}
            </div>
          </div>

          {/* Most Profitable */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-3 font-display uppercase tracking-tight">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center shrink-0">
                <DollarSign size={18} className="text-emerald-400" />
              </div>
              الأكثر ربحية (صافي)
            </h2>
            <div className="space-y-2.5">
                {analysis.mostProfitable.length === 0 ? (
                    <div className="py-10 text-center card border-dashed border-white/5 opacity-30">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">لا توجد بيانات حالياً</p>
                    </div>
                ) : (
                    analysis.mostProfitable.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card flex items-center gap-4 !py-3 !px-4 border-emerald-500/10 hover:border-emerald-500/30 group">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-[10px] shrink-0 border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm truncate font-display mb-0.5">{p.name}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest truncate">{p.category || 'بدون فئة'}</p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-base font-black text-emerald-400 font-display leading-none">{p.profit.toLocaleString('en-US')}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase mt-1 tracking-widest">ج.م</p>
                          </div>
                        </motion.div>
                      ))
                )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
