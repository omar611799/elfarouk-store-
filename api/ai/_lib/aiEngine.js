import { normalizeArabic, extractAutomotiveEntities, PART_TAXONOMY } from './automotiveTaxonomy.js'

/**
 * Multi-Factor Weighted Scoring for Auto Spare Parts
 */
export function calculateProductRankingScore(product, queryEntities = {}, options = {}) {
  let score = 0
  const normName = normalizeArabic(product.name || '')
  const normDesc = normalizeArabic(product.description || '')
  const normCategory = normalizeArabic(product.category || '')
  const normSku = normalizeArabic(product.sku || '')

  // 1. Vehicle Compatibility Match (Up to 45 points)
  if (queryEntities.make || queryEntities.model || queryEntities.year) {
    let exactVehicleMatch = false
    let partialVehicleMatch = false

    if (Array.isArray(product.compatibility) && product.compatibility.length > 0) {
      for (const comp of product.compatibility) {
        const compMake = normalizeArabic(comp.make || '')
        const compModel = normalizeArabic(comp.model || '')
        const reqMake = queryEntities.make ? normalizeArabic(queryEntities.make.nameAr) : ''
        const reqModel = queryEntities.model ? normalizeArabic(queryEntities.model.nameAr) : ''

        const makeMatches = !reqMake || compMake.includes(reqMake) || reqMake.includes(compMake)
        const modelMatches = !reqModel || compModel.includes(reqModel) || reqModel.includes(compModel)
        
        let yearMatches = true
        if (queryEntities.year) {
          const yStart = comp.yearStart ? parseInt(comp.yearStart, 10) : 1900
          const yEnd = comp.yearEnd ? parseInt(comp.yearEnd, 10) : 2099
          yearMatches = queryEntities.year >= yStart && queryEntities.year <= yEnd
        }

        if (makeMatches && modelMatches && yearMatches) {
          exactVehicleMatch = true
          break
        } else if (modelMatches || makeMatches) {
          partialVehicleMatch = true
        }
      }
    }

    // Fallback: Check title or description text for car model/make
    if (!exactVehicleMatch) {
      const qModelName = queryEntities.model ? normalizeArabic(queryEntities.model.nameAr) : ''
      const qMakeName = queryEntities.make ? normalizeArabic(queryEntities.make.nameAr) : ''
      if (qModelName && (normName.includes(qModelName) || normDesc.includes(qModelName))) {
        exactVehicleMatch = true
      } else if (qMakeName && (normName.includes(qMakeName) || normDesc.includes(qMakeName))) {
        partialVehicleMatch = true
      }
    }

    if (exactVehicleMatch) score += 45
    else if (partialVehicleMatch) score += 20
  }

  // 2. Part Type / Keyword Match (Up to 30 points)
  if (queryEntities.partType) {
    const partData = PART_TAXONOMY[queryEntities.partType.code]
    let partMatch = false
    if (product.partType === queryEntities.partType.code) {
      partMatch = true
    } else if (partData) {
      partMatch = partData.synonyms.some(s => {
        const ns = normalizeArabic(s)
        return normName.includes(ns) || normCategory.includes(ns) || normDesc.includes(ns)
      })
    }
    if (partMatch) score += 30
  } else if (queryEntities.rawQuery) {
    const rawTokens = normalizeArabic(queryEntities.rawQuery).split(' ').filter(Boolean)
    const matchingTokens = rawTokens.filter(t => normName.includes(t) || normSku.includes(t) || normCategory.includes(t))
    score += (matchingTokens.length / (rawTokens.length || 1)) * 25
  }

  // 3. Stock Availability (Up to 15 points)
  const qty = Number(product.quantity || 0)
  if (qty > 5) score += 15
  else if (qty > 0) score += 10
  else score -= 20 // Deprioritize out-of-stock items

  // 4. Quality Tier & Brand (Up to 10 points)
  if (product.qualityTier === 'oem') score += 10
  else if (product.qualityTier === 'oam_aftermarket') score += 8
  else if (product.brand) score += 5

  return Math.max(0, Math.round(score))
}

/**
 * Filter and Rank products safely from in-memory or Firestore list
 */
export function rankProducts(products = [], rawQuery = '', options = {}) {
  const entities = extractAutomotiveEntities(rawQuery)
  
  const scored = products.map(product => {
    const score = calculateProductRankingScore(product, entities, options)
    return {
      product,
      score,
      isCompatible: score >= 40,
    }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Filter out completely irrelevant items if a query was provided
  const results = rawQuery.trim()
    ? scored.filter(item => item.score > 15).map(item => item.product)
    : scored.map(item => item.product)

  return {
    entities,
    results: results.slice(0, options.limit || 20),
    totalMatches: results.length,
  }
}

/**
 * Croston's Method & Exponential Smoothing for Auto Parts Intermittent Demand Forecasting
 */
export function forecastProductDemand(salesHistory = [], currentStock = 0, leadTimeDays = 7) {
  // Aggregate sales by day over the last 60 days
  const dailyBuckets = {}
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  for (let i = 0; i < 60; i++) {
    const dayKey = new Date(now - i * DAY_MS).toISOString().slice(0, 10)
    dailyBuckets[dayKey] = 0
  }

  salesHistory.forEach(sale => {
    const dateStr = sale.date || (sale.createdAt ? new Date(sale.createdAt).toISOString().slice(0, 10) : null)
    if (dateStr && dailyBuckets[dateStr] !== undefined) {
      dailyBuckets[dateStr] += Number(sale.qty || sale.quantity || 1)
    }
  })

  const series = Object.values(dailyBuckets).reverse() // oldest to newest
  const nonZeroSales = series.filter(v => v > 0)

  let avgDemandSize = 1
  let avgInterval = 5 // days between sales

  if (nonZeroSales.length > 0) {
    avgDemandSize = nonZeroSales.reduce((a, b) => a + b, 0) / nonZeroSales.length
    avgInterval = Math.max(1, Math.round(series.length / nonZeroSales.length))
  } else {
    // If no sales history in the window
    return {
      forecast7Days: 0,
      forecast30Days: 0,
      dailyRate: 0,
      daysUntilStockOut: currentStock > 0 ? 999 : 0,
      reorderRecommended: currentStock <= 2,
      recommendedOrderQty: currentStock <= 2 ? 5 : 0,
      confidence: 'low (insufficient historical sales)',
      velocity: 'dead_stock',
    }
  }

  // Croston's daily estimate = DemandSize / Interval
  const dailyRate = avgDemandSize / avgInterval
  const forecast7Days = Math.ceil(dailyRate * 7)
  const forecast30Days = Math.ceil(dailyRate * 30)
  
  const daysUntilStockOut = dailyRate > 0 ? Math.floor(currentStock / dailyRate) : 999
  const reorderRecommended = currentStock <= forecast7Days
  const recommendedOrderQty = reorderRecommended ? Math.max(0, forecast30Days - currentStock + 5) : 0

  let velocity = 'normal'
  if (dailyRate >= 1) velocity = 'fast_moving'
  else if (dailyRate <= 0.1) velocity = 'slow_moving'

  return {
    forecast7Days,
    forecast30Days,
    dailyRate: Number(dailyRate.toFixed(2)),
    daysUntilStockOut,
    reorderRecommended,
    recommendedOrderQty,
    confidence: nonZeroSales.length >= 5 ? 'high' : 'medium',
    velocity,
  }
}

/**
 * Recommendation Engine: Frequently Bought Together & Complementary Parts
 */
export function getComplementaryRecommendations(currentProductId, allProducts = [], invoices = []) {
  const currentProd = allProducts.find(p => p.id === currentProductId)
  if (!currentProd) return []

  const entity = extractAutomotiveEntities(currentProd.name + ' ' + (currentProd.category || ''))
  const relatedPartCodes = entity.partType?.relatedParts || []

  // 1. Check Invoice Co-occurrences
  const coOccurCounts = {}
  invoices.forEach(inv => {
    const itemIds = (inv.items || []).map(it => it.productId || it.id)
    if (itemIds.includes(currentProductId)) {
      itemIds.forEach(otherId => {
        if (otherId && otherId !== currentProductId) {
          coOccurCounts[otherId] = (coOccurCounts[otherId] || 0) + 1
        }
      })
    }
  })

  // 2. Score candidates
  const candidates = allProducts
    .filter(p => p.id !== currentProductId && (p.quantity || 0) > 0)
    .map(p => {
      let recScore = (coOccurCounts[p.id] || 0) * 10
      const otherEntity = extractAutomotiveEntities(p.name + ' ' + (p.category || ''))
      
      // Bonus if taxonomy relates them
      if (otherEntity.partType && relatedPartCodes.includes(otherEntity.partType.code)) {
        recScore += 30
      }
      // Bonus if same category
      if (p.category && p.category === currentProd.category) {
        recScore += 10
      }
      return { product: p, recScore }
    })
    .filter(item => item.recScore > 0)
    .sort((a, b) => b.recScore - a.recScore)

  return candidates.slice(0, 4).map(c => c.product)
}

/**
 * Natural Language Response Generator for Customer Assistant (Zero-Hallucination Guaranteed)
 */
export function generateCustomerAssistantResponse({ query, entities, matchingProducts, complementary = [] }) {
  const count = matchingProducts.length
  const vehicleStr = [entities.make?.nameAr, entities.model?.nameAr, entities.year].filter(Boolean).join(' ')
  const partStr = entities.partType?.nameAr || 'القطعة المطلوبة'

  if (count === 0) {
    if (vehicleStr) {
      return {
        replyText: `عذراً، لم أجد حالياً منتجات متطابقة مع "${partStr}" لسيارة ${vehicleStr} في المخزن. \n\nيمكنك التواصل مع خدمة العملاء لطلبها مخصوص أو مراجعة رقم الشاسيه (VIN).`,
        products: [],
        suggestions: ['عرض جميع قطع ' + (entities.model?.nameAr || 'السيارة'), 'تحدث مع الدعم الفني'],
      }
    }
    return {
      replyText: `لم أتمكن من العثور على قطع غيار تطابق بحثك بدقة. يرجى تحديد نوع السيارة وسنة الصنع أو اسم القطعة بوضوح.`,
      products: [],
      suggestions: ['تيل فرامل كورولا 2018', 'فلتر زيت هيونداي النترا', 'مساعدين كيا سيراتو'],
    }
  }

  let text = `لقيت لك ${count} منتج متوافق ومتاح في المخزن`
  if (vehicleStr) text += ` لسيارة ${vehicleStr}:`
  else text += `:`

  return {
    replyText: text,
    vehicleIdentified: vehicleStr || null,
    products: matchingProducts,
    complementary: complementary.slice(0, 3),
    suggestions: [
      'الأرخص سعراً',
      'القطع الأصلية فقط (OEM)',
      'إيه القطع المكملة اللي محتاجها مع دي؟',
      'إضافة الكل للسلة'
    ],
  }
}
