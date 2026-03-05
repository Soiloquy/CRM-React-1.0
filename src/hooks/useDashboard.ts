import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 60_000,
  })
}

export function useDashboardTrend() {
  return useQuery({
    queryKey: ['dashboard-trend'],
    queryFn: () => dashboardService.getTrend(),
    staleTime: 60_000,
  })
}

export function useTypeDistribution() {
  return useQuery({
    queryKey: ['dashboard-type-distribution'],
    queryFn: () => dashboardService.getTypeDistribution(),
    staleTime: 60_000,
  })
}

export function useRiskTypeAnalysis() {
  return useQuery({
    queryKey: ['dashboard-risk-type-analysis'],
    queryFn: () => dashboardService.getRiskTypeAnalysis(),
    staleTime: 60_000,
  })
}

export function useNewClientTrend() {
  return useQuery({
    queryKey: ['dashboard-new-client-trend'],
    queryFn: () => dashboardService.getNewClientTrend(),
    staleTime: 60_000,
  })
}

export function useRecentFollowUps() {
  return useQuery({
    queryKey: ['dashboard-recent-follow-ups'],
    queryFn: () => dashboardService.getRecentFollowUps(),
    staleTime: 30_000,
  })
}

export function useGlobalSearch(keyword: string) {
  return useQuery({
    queryKey: ['global-search', keyword],
    queryFn: () => dashboardService.search(keyword),
    enabled: keyword.length >= 1,
    staleTime: 10_000,
  })
}
