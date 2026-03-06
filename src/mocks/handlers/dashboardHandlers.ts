import { http, HttpResponse } from 'msw'
import { mockProducts } from '../data/products'
import { mockClients } from '../data/clients'
import { mockHoldings } from '../data/holdings'
import { mockFollowUps } from '../data/followUps'
import { PRODUCT_TYPE_MAP } from '@/types/product'
// import { CLIENT_RISK_LEVEL_MAP } from '@/types/client'

export const dashboardHandlers = [
    // 总产品数、在售产品数、总客户数、本月新增客户数、本月新申购金额
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

  // 按产品 `type` 聚合在售产品的数量和规模，生成饼图数据。
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

  // 以“产品类型 × 客户风险等级”构建交叉表
  http.get('/api/dashboard/risk-type-analysis', () => {
    const crossMap = new Map<string, { low: number; medium: number; high: number }>()

    const activeTypes = new Set(
      mockProducts.filter((p) => p.status === 'active').map((p) => p.type)
    )
    activeTypes.forEach((type) => {
      crossMap.set(type, { low: 0, medium: 0, high: 0 })
    })

    const riskBucket = (riskLevel: string): 'low' | 'medium' | 'high' => {
      if (riskLevel === 'conservative' || riskLevel === 'stable') return 'low'
      if (riskLevel === 'balanced') return 'medium'
      return 'high' 
    }

    const productTypeMap = new Map(mockProducts.map((p) => [p.id, p.type]))
    const clientRiskMap = new Map(mockClients.map((c) => [c.id, c.riskLevel]))
    // 遍历所有持仓，根据产品类型和客户风险等级累加持仓金额。
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

  // 随机生成近 6 个月新增客户趋势
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

      months.push({
        month: monthStr,
        count: Math.max(count, 2 + Math.floor(Math.random() * 6)),
      })
    }

    return HttpResponse.json(months)
  }),

  // 返回 mockFollowUps 的前 10 条，给首页最近跟进列表使用。
  http.get('/api/dashboard/recent-follow-ups', () => {
    return HttpResponse.json(mockFollowUps.slice(0, 10))
  }),

  // 废弃接口，用于生成最近 12 个月的 AUM 曲线
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

  // 全局搜索
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
