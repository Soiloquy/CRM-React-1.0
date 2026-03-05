import api from './api'
import type {
  DashboardStats,
  TrendPoint,
  TypeDistribution,
  RiskTypeAnalysisItem,
  NewClientTrendPoint,
} from '@/types/common'
import type { FollowUp } from '@/types/holding'

export const dashboardService = {
  getStats(): Promise<DashboardStats> {
    return api.get('/dashboard/stats')
  },

  getTrend(): Promise<TrendPoint[]> {
    return api.get('/dashboard/trend')
  },

  getTypeDistribution(): Promise<TypeDistribution[]> {
    return api.get('/dashboard/type-distribution')
  },

  getRiskTypeAnalysis(): Promise<RiskTypeAnalysisItem[]> {
    return api.get('/dashboard/risk-type-analysis')
  },

  getNewClientTrend(): Promise<NewClientTrendPoint[]> {
    return api.get('/dashboard/new-client-trend')
  },

  getRecentFollowUps(): Promise<FollowUp[]> {
    return api.get('/dashboard/recent-follow-ups')
  },

  search(keyword: string): Promise<{
    products: Array<{ id: string; name: string; code: string }>
    clients: Array<{ id: string; name: string; phone: string }>
  }> {
    return api.get('/search', { params: { keyword } })
  },
}
