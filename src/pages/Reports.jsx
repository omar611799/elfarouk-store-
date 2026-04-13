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
        productStats[item.id].qtySold += item.qty
        // Prioritize cost recorded in the invoice, fallback to current product cost
        const itemCost = item.cost !== undefined ? item.cost : (products.find(p => p.id === item.id)?.cost || 0)
        productStats[item.id].profit += (item.price - itemCost) * item.qty
        
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariant} className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
          <BarChart3 className="text-primary-400" />
          تقارير الذكاء والمخزون
        </h1>
        <p className="text-slate-400 text-sm">حلل مبيعاتك واكتشف البضاعة الراكدة والأكثر ربحية</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariant} className="flex gap-2 bg-white/5 p-1.5 rounded-2xl w-full max-w-xl mx-auto md:mx-0 border border-white/5">
        <button 
          onClick={() => setActiveTab('dead-stock')} 
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dead-stock' ? 'bg-primary-500 text-white shadow-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          البضاعة الراكدة
        </button>
        <button 
          onClick={() => setActiveTab('top-sellers')} 
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'top-sellers' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          الأكثر مبيعاً وربحاً
        </button>
      </motion.div>

      {activeTab === 'dead-stock' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="glass-card flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <PackageX size={20} /> تقرير الركود
              </h2>
              <p className="text-sm text-slate-400 mt-1">منتجات متوفرة بالمخزن ولم تُباع منذ فترة محددة.</p>
            </div>
            <select value={monthsThreshold} onChange={e => setMonthsThreshold(Number(e.target.value))} className="input w-40 text-sm border-rose-500/20 focus:border-rose-500">
              <option value={1}>لم تُباع منذ شهر</option>
              <option value={3}>لم تُباع منذ 3 أشهر</option>
              <option value={6}>لم تُباع منذ 6 أشهر</option>
              <option value={12}>لم تُباع منذ سنة</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.deadStock.length === 0 ? (
              <div className="col-span-full text-center py-12 glass-card">
                <AlertOctagon size={40} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-white font-bold">ممتاز! لا توجد بضاعة راكدة لهذه الفترة.</p>
              </div>
            ) : (
              analysis.deadStock.map(p => (
                <motion.div key={p.id} whileHover={{ y: -4 }} className="glass-card border-rose-500/10 hover:border-rose-500/30 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl pointer-events-none" />
                  <p className="font-bold text-white mb-1">{p.name}</p>
                  <p className="text-xs text-rose-400 font-medium mb-3">{p.lastSold ? `آخر بيع: ${p.lastSold.toLocaleDateString('ar-EG')}` : 'لم تُباع أبداً'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">الرصيد المتاح:</span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">{p.currentStock} قطعة</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'top-sellers' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-4">
              <Package size={20} /> القطع الأكثر مبيعاً (كمية)
            </h2>
            {analysis.topSelling.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card flex items-center gap-4 py-3">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category || 'بدون فئة'}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-sm font-bold text-sky-400">{p.qtySold}</p>
                  <p className="text-[10px] text-slate-500">قطعة</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Most Profitable */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
              <DollarSign size={20} /> القطع الأكثر ربحية (صافي)
            </h2>
            {analysis.mostProfitable.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card flex items-center gap-4 py-3 border-emerald-500/10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category || 'بدون فئة'}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-sm font-bold text-emerald-400">{p.profit.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">ج.م</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  )
}
