import { http, HttpResponse } from 'msw'
import { mockProducts } from '../data/products'
import { mockClients } from '../data/clients'
import { PRODUCT_TYPE_MAP } from '@/types/product'
import { mockHoldings } from '../data/holdings'

export const productHandlers = [
  // 支持分页、筛选、搜索、排序
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const type = url.searchParams.get('type') || ''
    const status = url.searchParams.get('status') || ''
    const keyword = url.searchParams.get('keyword') || ''
    const sortBy = url.searchParams.get('sortBy') || ''
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    let filtered = [...mockProducts]

    if (type) {
      filtered = filtered.filter((p) => p.type === type)
    }
    if (status) {
      filtered = filtered.filter((p) => p.status === status)
    }
    if (keyword) {
      const kw = keyword.toLowerCase().trim()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.code.toLowerCase().includes(kw) ||
          (PRODUCT_TYPE_MAP[p.type] || '').toLowerCase().includes(kw) ||
          p.manager.toLowerCase().includes(kw)
      )
    }

    // Sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let valA: number, valB: number
        switch (sortBy) {
          case 'scale':
            valA = a.scale; valB = b.scale; break
          case 'nav':
            valA = a.nav; valB = b.nav; break
          case 'establishDate':
            valA = new Date(a.establishDate).getTime(); valB = new Date(b.establishDate).getTime(); break
          default:
            return 0
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
    }

    // Add holderCount to each product
    const dataWithHolders = filtered.map((p) => ({
      ...p,
      holderCount: mockHoldings.filter((h) => h.productId === p.id).length,
    }))

    const total = dataWithHolders.length
    const start = (page - 1) * pageSize
    const data = dataWithHolders.slice(start, start + pageSize)

    return HttpResponse.json({ data, total, page, pageSize })
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id)
    if (!product) {
      return new HttpResponse(null, { status: 404 })
    }

    const holders = mockHoldings.filter((h) => h.productId === product.id)
    const holderCount = holders.length
    const totalHoldingAmount = holders.reduce((sum, h) => sum + h.amount, 0)

    // Calculate total AUM of all active products
    const totalAum = mockProducts
      .filter((p) => p.status === 'active' || p.status === 'raising')
      .reduce((sum, p) => sum + p.scale, 0)
    const totalAumPercent = totalAum > 0 ? (product.scale / totalAum) * 100 : 0

    // Risk distribution of holders
    const clientRiskMap = new Map(mockClients.map((c) => [c.id, c.riskLevel]))
    const riskBucket = (riskLevel: string): 'low' | 'medium' | 'high' => {
      if (riskLevel === 'conservative' || riskLevel === 'stable') return 'low'
      if (riskLevel === 'balanced') return 'medium'
      return 'high'
    }

    const riskDistribution = { low: 0, medium: 0, high: 0 }
    holders.forEach((h) => {
      const risk = clientRiskMap.get(h.clientId)
      if (risk) {
        riskDistribution[riskBucket(risk)] += h.amount
      }
    })

    return HttpResponse.json({
      ...product,
      holderCount,
      totalHoldingAmount,
      totalAumPercent: Math.round(totalAumPercent * 100) / 100,
      riskDistribution,
    })
  }),

  http.get('/api/products/:id/holders', ({ params }) => {
    const holders = mockHoldings.filter((h) => h.productId === params.id)
    return HttpResponse.json(holders)
  }),
]
