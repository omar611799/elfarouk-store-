import { getAdminDb, adminTimestamp } from './_lib/firebaseAdmin.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { extractAutomotiveEntities } from './ai/_lib/automotiveTaxonomy.js'
import { rankProducts, generateCustomerAssistantResponse, getComplementaryRecommendations } from './ai/_lib/aiEngine.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Rate Limiting (60 requests per minute per IP)
  const clientIp = getClientIp(req)
  const rateResult = await checkRateLimit({
    scope: 'ai_customer_assistant',
    identifier: clientIp,
    maxAttempts: 60,
    windowMs: 60 * 1000,
  })

  if (!rateResult.allowed) {
    return res.status(429).json({
      error: 'لقد تجاوزت الحد المسموح من الطلبات. برجاء الانتظار قليلاً.',
      retryAfterSeconds: rateResult.retryAfterSeconds,
    })
  }

  try {
    const { message = '', vehicle = null, sessionId = null } = req.body || {}
    const rawQuery = String(message || '').trim()

    if (!rawQuery && !vehicle) {
      return res.status(400).json({ error: 'الرجاء إدخال نص البحث أو اختيار السيارة' })
    }

    const db = getAdminDb()

    // 1. Fetch active products from Firestore
    const productsSnap = await db.collection('products').limit(500).get()
    const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // 2. Fetch sample recent invoices for co-occurrence / recommendations
    const invoicesSnap = await db.collection('invoices').orderBy('createdAt', 'desc').limit(150).get().catch(() => ({ docs: [] }))
    const recentInvoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // 3. Extract entities (incorporating explicit vehicle selection if provided)
    const combinedQuery = [
      vehicle?.make,
      vehicle?.model,
      vehicle?.year,
      rawQuery
    ].filter(Boolean).join(' ')

    const entities = extractAutomotiveEntities(combinedQuery)

    // Override entities if explicit vehicle object was sent
    if (vehicle?.make && !entities.make) entities.make = { nameAr: vehicle.make }
    if (vehicle?.model && !entities.model) entities.model = { nameAr: vehicle.model }
    if (vehicle?.year && !entities.year) entities.year = parseInt(vehicle.year, 10)

    // 4. Rank products
    const { results } = rankProducts(allProducts, combinedQuery, { limit: 6 })

    // 5. Fetch complementary recommendations for the top match
    let complementary = []
    if (results.length > 0) {
      complementary = getComplementaryRecommendations(results[0].id, allProducts, recentInvoices)
    }

    // 6. Generate Response
    const responsePayload = generateCustomerAssistantResponse({
      query: rawQuery,
      entities,
      matchingProducts: results,
      complementary,
    })

    // 7. Asynchronously Log query for Analytics & Future Training
    db.collection('search_logs').add({
      query: rawQuery,
      vehicle: vehicle || entities.make?.nameAr || null,
      entities: {
        make: entities.make?.nameAr || null,
        model: entities.model?.nameAr || null,
        year: entities.year || null,
        partType: entities.partType?.code || null,
      },
      resultsCount: results.length,
      zeroResults: results.length === 0,
      ip: clientIp,
      sessionId: sessionId || null,
      createdAt: adminTimestamp(),
    }).catch(err => console.error('Failed to log search:', err))

    return res.status(200).json({
      success: true,
      ...responsePayload,
    })
  } catch (error) {
    console.error('Customer AI Assistant error:', error)
    return res.status(500).json({
      error: 'حدث خطأ أثناء معالجة الطلب الذكي',
      details: error.message,
    })
  }
}
