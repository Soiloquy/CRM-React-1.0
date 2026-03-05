import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService, type ClientListParams, type CreateFollowUpParams } from '@/services/clientService'

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientService.getList(params),
    staleTime: 30_000,
  })
}

export function useClientDetail(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useClientHoldings(id: string) {
  return useQuery({
    queryKey: ['client-holdings', id],
    queryFn: () => clientService.getHoldings(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useClientFollowUps(id: string) {
  return useQuery({
    queryKey: ['client-follow-ups', id],
    queryFn: () => clientService.getFollowUps(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateFollowUp(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFollowUpParams) =>
      clientService.createFollowUp(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-follow-ups', clientId] })
      queryClient.invalidateQueries({ queryKey: ['client', clientId] })
    },
  })
}
