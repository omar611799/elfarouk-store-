import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Send,
  Database,
  BarChart3,
  Search,
  ShoppingCart,
  DollarSign,
  Truck,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import toast from 'react-hot-toast'

const SUGGESTED_ERP_QUESTIONS = [
  'إيه أكتر 10 منتجات اتباعوا الشهر ده؟',
  'إيه المنتجات اللي مخزونها قليل ومعرضة للنفاد؟',
  'إيه المنتجات الراكدة اللي مش بتتحرك خالص؟',
  'تحليل نشاط الموردين والمشتريات',
  'كميات إعادة الطلب الموصى بها لهذا الشهر',
]

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function AIBusinessAssistant() {
  const { currentUser } = useAuth()
  const { products, invoices, purchases, suppliers = [], recordPurchase } = useStore()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [question, setQuestion] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [activeTab, setActiveTab] = useState('forecast') // forecast | insights | deadstock | qna
  const [showPOModal, setShowPOModal] = useState(false)

  // Group Low-Stock Reorder Recommendations by Supplier
  const ordersBySupplier = useMemo(() => {
    if (!data?.lowStockAlerts) return {}
    const groups = {}
    data.lowStockAlerts.forEach((item) => {
      const fullProd = products.find((p) => p.id === item.id) || item
      const supplierName = fullProd.supplier || 'بدون مورد محدد'
      const matchingSupplier = suppliers.find((s) => s.name === supplierName)
      const sKey = matchingSupplier?.id || supplierName

      if (!groups[sKey]) {
        groups[sKey] = {
          supplierId: matchingSupplier?.id || null,
          supplierName,
          supplierPhone: matchingSupplier?.phone || '',
          items: [],
          totalCost: 0,
        }
      }

      const orderQty = item.recommendedOrderQty || 5
      const cost = Number(item.cost || fullProd.cost || 0)
      const lineTotal = orderQty * cost

      groups[sKey].items.push({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        recommendedQty: orderQty,
        cost,
        lineTotal,
      })
      groups[sKey].totalCost += lineTotal
    })
    return groups
  }, [data?.lowStockAlerts, products, suppliers])

  const handleCreatePO = async (group) => {
    if (!group.items.length) return
    const toastId = toast.loading(`جاري تسجيل فاتورة مشتريات لـ ${group.supplierName}...`)
    try {
      const billNumber = `AI-PO-${Date.now().toString().slice(-6)}`
      await recordPurchase({
        supplierId: group.supplierId || group.supplierName,
        items: group.items.map((i) => ({
          id: i.id,
          name: i.name,
          qty: i.recommendedQty,
          cost: i.cost,
        })),
        total: group.totalCost,
        paidAmount: 0,
        billNumber,
      })
      toast.success(`تم إنشاء فاتورة مشتريات #${billNumber} بنجاح!`, { id: toastId })
      fetchDashboardData()
    } catch (err) {
      toast.error('فشل إنشاء فاتورة المشتريات: ' + err.message, { id: toastId })
    }
  }

  const handleSendSupplierWhatsApp = (group) => {
    let text = `*طلب شراء وتوريد نواقص - الفاروق ستور لقطع الغيار*\n`
    text += `المورد: ${group.supplierName}\n`
    text += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`
    text += `━━━━━━━━━━━━━━━━━━━\n`
    group.items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}* — المطلوب: *${item.recommendedQty} قطعة*\n`
    })
    text += `━━━━━━━━━━━━━━━━━━━\n`
    text += `إجمالي القيمة التقديرية: *${group.totalCost.toLocaleString('ar-EG')} ج.م*\n`
    text += `يرجى تأكيد التوافر والتجهيز، شكراً لكم.`

    const phone = group.supplierPhone ? group.supplierPhone.replace(/^0/, '20') : ''
    if (!phone) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  // Fetch Dashboard AI Metrics
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = await currentUser?.getIdToken?.()
      if (!token) throw new Error('يرجى تسجيل الدخول أولاً')

      const res = await fetch('/api/ai-business-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'dashboard' }),
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'فشل جلب بيانات الذكاء الاصطناعي')

      setData(resData)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'خطأ في الاتصال بخدمة التحليلات الذكية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [currentUser])

  // Handle Natural Language ERP Query
  const handleAskQuestion = async (customQ = null) => {
    const q = typeof customQ === 'string' ? customQ : question
    if (!q.trim()) return

    setQueryLoading(true)
    const userMessage = { sender: 'user', text: q, timestamp: new Date() }
    setChatHistory((prev) => [...prev, userMessage])
    setQuestion('')

    try {
      const token = await currentUser?.getIdToken?.()
      const res = await fetch('/api/ai-business-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'query',
          question: q,
        }),
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'فشل الرد على الاستفسار')

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: resData.answer,
          dataTable: resData.dataTable,
          insights: resData.insights,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      toast.error(err.message)
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'عذراً، حدث خطأ أثناء معالجة السؤال. تأكد من اتصال الإنترنت وصلاحيات الحساب.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setQueryLoading(false)
    }
  }

  // Visual Chart Data
  const fastMovingChartData = useMemo(() => {
    if (!data?.fastMoving) return []
    return data.fastMoving.map((item) => ({
      name: item.name.length > 18 ? item.name.slice(0, 18) + '...' : item.name,
      مبيعات_30_يوم: item.totalSold30d,
      المخزون: item.currentStock,
    }))
  }, [data])

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white">
                  ELFAROUK AI Business Intelligence
                </h1>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  Realtime ERP Layer
                </span>
              </div>
              <p className="mt-1 text-xs md:text-sm text-slate-300">
                مساعد صاحب المحل الذكي للتنبؤ بالطلب، تحليل المخزون، وتوليد الرؤى المالية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all border border-slate-700 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>إعادة حساب التوقعات</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        {data?.insightsSummary && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>تنبيهات نقص المخزون</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-400">
                {data.insightsSummary.lowStockCount}
              </p>
              <span className="text-[11px] text-slate-400">قطع معرضة للنفاد قريباً</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>المخزون الراكد</span>
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-red-400">
                {data.insightsSummary.deadStockCount}
              </p>
              <span className="text-[11px] text-slate-400">منتجات لم تُباع خلال 30 يوم</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>قيمة رأس المال الراكد</span>
                <DollarSign className="h-4 w-4 text-rose-400" />
              </div>
              <p className="mt-2 text-xl font-black text-white">
                {Number(data.insightsSummary.deadStockCost || 0).toLocaleString('ar-EG')} ج.م
              </p>
              <span className="text-[11px] text-slate-400">مغلقة في قطع غير متحركة</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>تكلفة إعادة الطلب المقترحة</span>
                <Truck className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-xl font-black text-cyan-400">
                {Number(data.insightsSummary.reorderEstimatedCost || 0).toLocaleString('ar-EG')} ج.م
              </p>
              <span className="text-[11px] text-slate-400">لتغطية طلب الشهر القادم</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2 overflow-x-auto">
        {[
          { id: 'forecast', label: 'التنبؤ بالطلب وإعادة الشراء', icon: TrendingUp },
          { id: 'qna', label: 'اسأل مساعد المتجر الذكي (Chat)', icon: Sparkles },
          { id: 'deadstock', label: 'تحليل الرواكد ومعدل الحركة', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: Demand Forecasting & Smart Reordering */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Top Selling Chart */}
          {fastMovingChartData.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  مقارنة مبيعات أعلى المنتجات حركة مقابل المخزون الحالي
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fastMovingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="مبيعات_30_يوم" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="المخزون" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Forecasting Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  جدول التنبؤ بالطلب (Croston's Intermittent Demand Forecasting)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حسابات الذكاء الاصطناعي لمعدل الاستهلاك اليومي وتاريخ النفاد المقدر
                </p>
              </div>

              {Object.keys(ordersBySupplier).length > 0 && (
                <button
                  onClick={() => setShowPOModal(true)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/30"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>توليد أوامر الشراء للنواقص ({Object.keys(ordersBySupplier).length} مورد)</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">المخزون الحالي</th>
                    <th className="p-3.5">المبيعات (آخر 30 يوم)</th>
                    <th className="p-3.5">الطلب المتوقع (7 أيام)</th>
                    <th className="p-3.5">الطلب المتوقع (30 يوم)</th>
                    <th className="p-3.5">الأيام حتى النفاد</th>
                    <th className="p-3.5">توصية الشراء</th>
                    <th className="p-3.5">حالة الحركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {data?.forecasts?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-medium text-white max-w-[200px] truncate">
                        {item.name}
                      </td>
                      <td className="p-3.5 font-bold">
                        <span
                          className={`rounded px-2 py-0.5 ${
                            item.currentStock <= item.minStock
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="p-3.5">{item.totalSold30d} قطعة</td>
                      <td className="p-3.5 text-cyan-400 font-bold">{item.forecast7Days}</td>
                      <td className="p-3.5 text-blue-400 font-bold">{item.forecast30Days}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            item.daysUntilStockOut <= 7
                              ? 'text-red-400'
                              : item.daysUntilStockOut <= 20
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.daysUntilStockOut === 999
                            ? 'مستقر (> 90 يوم)'
                            : `${item.daysUntilStockOut} يوم`}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.reorderRecommended ? (
                          <span className="rounded-lg bg-red-500/20 text-red-300 px-2 py-1 font-bold border border-red-500/30">
                            اطلب +{item.recommendedOrderQty} قطعة
                          </span>
                        ) : (
                          <span className="text-slate-500">كافٍ حالياً</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.velocity === 'fast_moving'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.velocity === 'dead_stock'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-700/50 text-slate-300'
                          }`}
                        >
                          {item.velocity === 'fast_moving'
                            ? 'سريع الحركة'
                            : item.velocity === 'dead_stock'
                            ? 'راكد'
                            : 'عادي'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Natural Language ERP Q&A Chat */}
      {activeTab === 'qna' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 overflow-hidden shadow-2xl flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                اسأل مساعد الـ ERP باللغة الطبيعية
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              دعم اللهجة المصرية واستخراج جداول المبيعات والمخزون
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  أهلاً بك! اكتب أي سؤال عن مبيعات المحل أو المخزون
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  يمكنك الاستفسار عن أكثر المنتجات مبيعاً، أو النواقص، أو الموردين، وسيقوم الذكاء
                  الاصطناعي بتحليل البيانات فوراً.
                </p>

                {/* Suggestions */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-lg">
                  {SUGGESTED_ERP_QUESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskQuestion(sug)}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">{msg.text}</p>

                  {/* Render Data Table if returned */}
                  {msg.dataTable && msg.dataTable.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/90">
                      <table className="w-full text-right text-[11px]">
                        <thead className="bg-slate-800 text-cyan-300 border-b border-slate-700">
                          <tr>
                            {Object.keys(msg.dataTable[0]).map((key) => (
                              <th key={key} className="p-2.5">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {msg.dataTable.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="p-2.5 font-medium text-slate-200">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {queryLoading && (
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>جاري استعلام الـ ERP وتحليل الأرقام...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAskQuestion()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="اكتب سؤالك (مثال: إيه أكتر 5 منتجات اتباعوا الأسبوع ده؟)..."
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-800/90 py-3 px-4 text-xs text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={queryLoading || !question.trim()}
                className="flex h-11 px-5 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-xs hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all shadow-md shadow-blue-500/20"
              >
                <Send className="h-4 w-4 rotate-180 ml-1.5" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Dead Stock & Velocity Analyzer */}
      {activeTab === 'deadstock' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  قائمة المنتجات الراكدة (لم يتم بيع أي قطعة منها في الـ 30 يوماً الماضية)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إجمالي رأس المال المجمد: {Number(data?.insightsSummary?.deadStockCost || 0).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">الفئة</th>
                    <th className="p-3.5">المخزون الراكد</th>
                    <th className="p-3.5">سعر التكلفة</th>
                    <th className="p-3.5">سعر البيع</th>
                    <th className="p-3.5">إجمالي القيمة المجمدة</th>
                    <th className="p-3.5">توصية الذكاء الاصطناعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {data?.deadStock?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-white">{item.name}</td>
                      <td className="p-3.5 text-slate-400">{item.category || 'عام'}</td>
                      <td className="p-3.5 font-bold text-rose-400">{item.currentStock} قطعة</td>
                      <td className="p-3.5">{item.cost} ج.م</td>
                      <td className="p-3.5">{item.price} ج.م</td>
                      <td className="p-3.5 font-bold text-white">
                        {(item.currentStock * item.cost).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-lg bg-amber-500/20 text-amber-300 px-2 py-1 text-[11px] font-semibold border border-amber-500/30">
                          اعمل خصم 10% أو اربطه كعرض مكمل
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONE-CLICK PURCHASE ORDER GENERATOR MODAL (GROUPED BY SUPPLIER) */}
      <AnimatePresence>
        {showPOModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      توليد أوامر الشراء للنواقص (مقسمة لكل مورد)
                    </h3>
                    <p className="text-xs text-slate-400">
                      بناءً على التنبؤ الإحصائي بالطلب، تم تجميع {Object.keys(ordersBySupplier).length} أمر شراء للموردين
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPOModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                {Object.entries(ordersBySupplier).map(([sKey, group]) => (
                  <div
                    key={sKey}
                    className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Truck className="h-4 w-4 text-cyan-400" />
                          المورد: {group.supplierName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {group.items.length} قطع مطلوبة • إجمالي القيمة: {group.totalCost.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendSupplierWhatsApp(group)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                        >
                          <span>إرسال واتساب</span>
                        </button>

                        <button
                          onClick={() => handleCreatePO(group)}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-blue-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>اعتماد فاتورة المشتريات</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-400 font-semibold border-b border-slate-700/40 text-[11px]">
                          <tr>
                            <th className="pb-2">اسم القطعة</th>
                            <th className="pb-2">المخزون الحالي</th>
                            <th className="pb-2">الكمية المقترح شراؤها</th>
                            <th className="pb-2">سعر التكلفة التقديري</th>
                            <th className="pb-2">إجمالي السطر</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {group.items.map((it) => (
                            <tr key={it.id}>
                              <td className="py-2 text-white font-medium">{it.name}</td>
                              <td className="py-2 text-amber-400 font-bold">{it.currentStock}</td>
                              <td className="py-2 text-cyan-400 font-black">+{it.recommendedQty}</td>
                              <td className="py-2">{it.cost.toLocaleString('ar-EG')} ج.م</td>
                              <td className="py-2 font-bold text-white">{it.lineTotal.toLocaleString('ar-EG')} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
