import type { Holding } from '@/types/holding'
import { mockProducts } from './products'
import { mockClients } from './clients'

// 买入日期随机生成
function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

const holdingPairs: Array<[number, number]> = []
const usedPairs = new Set<string>()

for (let i = 0; i < 55; i++) {
  let clientIdx: number, productIdx: number, key: string
  do {
    clientIdx = Math.floor(Math.random() * Math.min(30, mockClients.length))
    productIdx = Math.floor(Math.random() * Math.min(25, mockProducts.length))
    key = `${clientIdx}-${productIdx}`
  } while (usedPairs.has(key))
  usedPairs.add(key)
  holdingPairs.push([clientIdx, productIdx])
}

//生成 shares（份额）、amount（市值）、buyDate（买入日期）、returnRate（收益率）
export const mockHoldings: Holding[] = holdingPairs.map(([ci, pi], idx) => {
  const client = mockClients[ci]
  const product = mockProducts[pi]
  const shares = Math.round((1000 + Math.random() * 100000) * 100) / 100
  const amount = Math.round(shares * product.nav * 100) / 100
  const returnRate = (Math.random() - 0.3) * 0.5

  return {
    id: `holding_${String(idx + 1).padStart(3, '0')}`,
    clientId: client.id,
    clientName: client.name,
    productId: product.id,
    productName: product.name,
    productCode: product.code,
    shares,
    amount,
    buyDate: randomDate(2021, 2025),
    returnRate: Math.round(returnRate * 10000) / 10000,
  }
})
