import { getAdminDb, getAdminAuth } from './_lib/firebaseAdmin.js'
import { forecastProductDemand } from './ai/_lib/aiEngine.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Verify Firebase Auth Token (Staff Only)
  const authHeader = req.headers.authorization || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: missing token' })
  }

  try {
    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(decoded.uid).get()
    const role = userSnap.exists ? userSnap.data().role : null
    if (!['admin', 'cashier'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden: staff only' })
    }

    const { action = 'query', question = '', dateRange = '30d' } = req.body || {}

    // 1. Fetch current ERP datasets
    const [productsSnap, invoicesSnap, purchasesSnap, suppliersSnap] = await Promise.all([
      db.collection('products').limit(500).get(),
      db.collection('invoices').orderBy('createdAt', 'desc').limit(500).get(),
      db.collection('purchases').orderBy('createdAt', 'desc').limit(200).get().catch(() => ({ docs: [] })),
      db.collection('suppliers').limit(100).get().catch(() => ({ docs: [] })),
    ])

    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const purchases = purchasesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const suppliers = suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // 2. Compute Product Sales & Velocities
    const productSalesMap = {}
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    invoices.forEach(inv => {
      const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate().getTime() : (inv.createdAt ? new Date(inv.createdAt).getTime() : 0)
      const isWithin30d = invDate >= thirtyDaysAgo

      ;(inv.items || []).forEach(item => {
        const pId = item.productId || item.id
        if (!pId) return
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            totalQtySold: 0,
            totalRevenue: 0,
            recentSalesHistory: [],
          }
        }
        const qty = Number(item.qty || item.quantity || 1)
        const price = Number(item.price || 0)
        productSalesMap[pId].totalQtySold += qty
        productSalesMap[pId].totalRevenue += (qty * price)
        if (isWithin30d) {
          productSalesMap[pId].recentSalesHistory.push({
            qty,
            date: new Date(invDate).toISOString(),
          })
        }
      })
    })

    // 3. Demand Forecasting for all products
    const forecasts = products.map(product => {
      const salesData = productSalesMap[product.id] || { totalQtySold: 0, totalRevenue: 0, recentSalesHistory: [] }
      const forecast = forecastProductDemand(salesData.recentSalesHistory, Number(product.quantity || 0))
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        sku: product.sku,
        currentStock: Number(product.quantity || 0),
        minStock: Number(product.minStock || 5),
        cost: Number(product.cost || 0),
        price: Number(product.price || 0),
        totalSold30d: salesData.totalQtySold,
        ...forecast,
      }
    })

    // 4. Summaries & Insights
    const lowStockAlerts = forecasts.filter(f => f.currentStock <= f.minStock || f.reorderRecommended)
    const fastMoving = [...forecasts].sort((a, b) => b.totalSold30d - a.totalSold30d).slice(0, 8).filter(f => f.totalSold30d > 0)
    const deadStock = forecasts.filter(f => f.totalSold30d === 0 && f.currentStock > 0)
    
    // Total inventory value at risk
    const totalDeadStockCost = deadStock.reduce((sum, item) => sum + (item.currentStock * item.cost), 0)
    const totalReorderEstimate = lowStockAlerts.reduce((sum, item) => sum + (item.recommendedOrderQty * item.cost), 0)

    // Handle Natural Language ERP Questions
    if (action === 'query' && question.trim()) {
      const q = question.toLowerCase()
      let answerText = ''
      let dataTable = null

      if (q.includes('اكتر') || q.includes('اكثر') || q.includes('مبيعا') || q.includes('top selling')) {
        answerText = `أكثر ${fastMoving.length} منتجات مبيعاً خلال آخر 30 يوماً:`
        dataTable = fastMoving.map(p => ({
          المنتج: p.name,
          'الكمية المباعة': p.totalSold30d,
          'المخزون الحالي': p.currentStock,
          'الطلب المتوقع (30 يوم)': p.forecast30Days,
        }))
      } else if (q.includes('قليل') || q.includes('ينفد') || q.includes('ناقص') || q.includes('low stock')) {
        answerText = `يوجد ${lowStockAlerts.length} منتجات مخزونها أقل من الحد الأدنى أو معرضة للنفاد قريباً:`
        dataTable = lowStockAlerts.slice(0, 10).map(p => ({
          المنتج: p.name,
          'المخزون الحالي': p.currentStock,
          'الحد الأدنى': p.minStock,
          'الكمية الموصى بشرائها': p.recommendedOrderQty,
        }))
      } else if (q.includes('راكد') || q.includes('مش بيتحرك') || q.includes('dead stock')) {
        answerText = `يوجد ${deadStock.length} منتجات راكدة لم يتم بيع أي قطعة منها خلال آخر شهر بإجمالي تكلفة مخزنة ${totalDeadStockCost.toLocaleString('ar-EG')} ج.م:`
        dataTable = deadStock.slice(0, 10).map(p => ({
          المنتج: p.name,
          'المخزون الراكد': p.currentStock,
          'تكلفة القطعة': `${p.cost} ج.م`,
          'إجمالي القيمة': `${p.currentStock * p.cost} ج.م`,
        }))
      } else if (q.includes('مورد') || q.includes('suppliers')) {
        answerText = `تحليل نشاط الموردين وإجمالي المشتريات:`
        dataTable = suppliers.map(s => ({
          المورد: s.name,
          الهاتف: s.phone || 'غير مسجل',
          'الرصيد / المديونية': `${s.balance || 0} ج.م`,
        }))
      } else {
        answerText = `بناءً على تحليل بيانات الـ ERP: تم بيع منتجات بقيمة إجمالية نشطة، ويوجد ${lowStockAlerts.length} تنبيه مخزون، و ${deadStock.length} منتج راكد بحاجة لتنشيط المبيعات.`
      }

      return res.status(200).json({
        success: true,
        answer: answerText,
        dataTable,
        insights: {
          lowStockCount: lowStockAlerts.length,
          deadStockCount: deadStock.length,
          fastMovingCount: fastMoving.length,
          totalReorderEstimate,
        }
      })
    }

    // Default: Return Full Business AI Dashboard Payload
    return res.status(200).json({
      success: true,
      insightsSummary: {
        totalProducts: products.length,
        lowStockCount: lowStockAlerts.length,
        deadStockCount: deadStock.length,
        deadStockCost: totalDeadStockCost,
        reorderEstimatedCost: totalReorderEstimate,
      },
      forecasts: forecasts.slice(0, 50),
      lowStockAlerts: lowStockAlerts.slice(0, 20),
      fastMoving: fastMoving.slice(0, 10),
      deadStock: deadStock.slice(0, 15),
    })
  } catch (error) {
    console.error('AI Business Assistant error:', error)
    return res.status(500).json({
      error: 'حدث خطأ أثناء معالجة استعلامات الـ ERP الذكية',
      details: error.message,
    })
  }
}
