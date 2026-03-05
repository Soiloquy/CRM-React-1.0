export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalClients: number
  newClientsThisMonth: number
  newSubscriptionAmount: number
}

export interface TrendPoint {
  month: string
  aum: number
}

export interface TypeDistribution {
  type: string
  label: string
  count: number
  scale: number
}

export interface RiskTypeAnalysisItem {
  productType: string
  low: number
  medium: number
  high: number
}

export interface NewClientTrendPoint {
  month: string
  count: number
}
