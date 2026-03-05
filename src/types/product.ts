export interface Product {
  id: string
  code: string
  name: string
  type: ProductType
  status: ProductStatus
  nav: number
  cumulativeNav: number
  dailyReturn: number
  scale: number
  manager: string
  managementCompany: string
  custodian: string
  establishDate: string
  riskLevel: RiskLevel
  description: string
  navHistory: NavPoint[]
}

export type ProductType =
  | 'equity'
  | 'bond'
  | 'hybrid'
  | 'money_market'
  | 'index'
  | 'qdii'

export type ProductStatus = 'active' | 'raising' | 'suspended' | 'liquidated'

export type RiskLevel =
  | 'conservative'
  | 'stable'
  | 'balanced'
  | 'aggressive'
  | 'radical'

export interface NavPoint {
  date: string
  nav: number
}

export const PRODUCT_TYPE_MAP: Record<ProductType, string> = {
  equity: '股票型',
  bond: '债券型',
  hybrid: '混合型',
  money_market: '货币型',
  index: '指数型',
  qdii: 'QDII',
}

export const PRODUCT_STATUS_MAP: Record<ProductStatus, string> = {
  raising: '募集中',
  active: '在售',
  suspended: '暂停申购',
  liquidated: '已清盘',
}

export const PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  raising: 'blue',
  active: 'green',
  suspended: 'orange',
  liquidated: 'default',
}
