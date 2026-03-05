import { http, HttpResponse } from 'msw'
import { mockProducts } from '../data/products'
import { mockClients } from '../data/clients'
import { mockHoldings } from '../data/holdings'
import { mockFollowUps } from '../data/followUps'
import { PRODUCT_TYPE_MAP } from '@/types/product'
import { CLIENT_RISK_LEVEL_MAP } from '@/types/client'

export const dashboardHandlers = [
  // Stats endpoint - now includes totalProducts and newSubscriptionAmount
  http.get('/api/dashboard/stats', () => {
    const totalProducts = mockProducts.length
    const activeProducts = mockProducts.filter((p) => p.status === 'active').length
    const totalClients = mockClients.length
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newClientsThisMonth = mockClients.filter(
      (c) => new Date(c.createdAt) >= thisMonth
    ).length

    // Simulate new subscription amount this month
    const thisMonthStr = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`
    const newSubscriptionAmount = mockHoldings
      .filter((h) => h.buyDate >= thisMonthStr)
      .reduce((sum, h) => sum + h.amount, 0) || 4523.67e4

    return HttpResponse.json({
      totalProducts,
      activeProducts,
      totalClients,
      newClientsThisMonth: Math.max(newClientsThisMonth, 5),
      newSubscriptionAmount,
    })
  }),

  // Type distribution - pie chart: product type scale distribution
  http.get('/api/dashboard/type-distribution', () => {
    const typeMap = new Map<string, { count: number; scale: number }>()

    mockProducts
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        const existing = typeMap.get(p.type) || { count: 0, scale: 0 }
        typeMap.set(p.type, {
          count: existing.count + 1,
          scale: existing.scale + p.scale,
        })
      })

    const distribution = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      label: PRODUCT_TYPE_MAP[type as keyof typeof PRODUCT_TYPE_MAP] || type,
      count: data.count,
      scale: data.scale,
    }))

    return HttpResponse.json(distribution)
  }),

  // Risk x Product Type cross analysis - stacked bar chart
  http.get('/api/dashboard/risk-type-analysis', () => {
    // Build a cross-tabulation of product type (X) vs client risk level (stacked)
    // For each holding, find the product type and the client risk level,
    // then accumulate the holding amount.
    const crossMap = new Map<string, { low: number; medium: number; high: number }>()

    // Initialize all active product types
    const activeTypes = new Set(
      mockProducts.filter((p) => p.status === 'active').map((p) => p.type)
    )
    activeTypes.forEach((type) => {
      crossMap.set(type, { low: 0, medium: 0, high: 0 })
    })

    // Map client risk levels to low/medium/high buckets
    const riskBucket = (riskLevel: string): 'low' | 'medium' | 'high' => {
      if (riskLevel === 'conservative' || riskLevel === 'stable') return 'low'
      if (riskLevel === 'balanced') return 'medium'
      return 'high' // aggressive, radical
    }

    // Build product id -> type lookup
    const productTypeMap = new Map(mockProducts.map((p) => [p.id, p.type]))
    // Build client id -> riskLevel lookup
    const clientRiskMap = new Map(mockClients.map((c) => [c.id, c.riskLevel]))

    mockHoldings.forEach((holding) => {
      const productType = productTypeMap.get(holding.productId)
      const clientRisk = clientRiskMap.get(holding.clientId)
      if (!productType || !clientRisk || !activeTypes.has(productType)) return

      const bucket = riskBucket(clientRisk)
      const existing = crossMap.get(productType) || { low: 0, medium: 0, high: 0 }
      existing[bucket] += holding.amount
      crossMap.set(productType, existing)
    })

    const result = Array.from(crossMap.entries()).map(([type, data]) => ({
      productType: PRODUCT_TYPE_MAP[type as keyof typeof PRODUCT_TYPE_MAP] || type,
      low: Math.round(data.low),
      medium: Math.round(data.medium),
      high: Math.round(data.high),
    }))

    return HttpResponse.json(result)
  }),

  // New client trend - 6 months line chart
  http.get('/api/dashboard/new-client-trend', () => {
    const now = new Date()
    const months: Array<{ month: string; count: number }> = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      const count = mockClients.filter((c) => {
        const cd = new Date(c.createdAt)
        return cd >= d && cd < nextMonth
      }).length

      // Ensure at least some data for visual interest
      months.push({
        month: monthStr,
        count: Math.max(count, 2 + Math.floor(Math.random() * 6)),
      })
    }

    return HttpResponse.json(months)
  }),

  // Recent follow-ups
  http.get('/api/dashboard/recent-follow-ups', () => {
    return HttpResponse.json(mockFollowUps.slice(0, 10))
  }),

  // Legacy trend endpoint (still available)
  http.get('/api/dashboard/trend', () => {
    const months: Array<{ month: string; aum: number }> = []
    const now = new Date()
    const baseAum = mockProducts
      .filter((p) => p.status === 'active')
      .reduce((sum, p) => sum + p.scale, 0)

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const factor = 0.75 + (11 - i) * 0.025 + (Math.random() - 0.5) * 0.05
      months.push({
        month: monthStr,
        aum: Math.round(baseAum * factor),
      })
    }

    return HttpResponse.json(months)
  }),

  // Global search
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase()

    if (!keyword) {
      return HttpResponse.json({ products: [], clients: [] })
    }

    const products = mockProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.code.includes(keyword)
      )
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, code: p.code }))

    const clients = mockClients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          c.phone.includes(keyword)
      )
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, phone: c.phone }))

    return HttpResponse.json({ products, clients })
  }),
]
