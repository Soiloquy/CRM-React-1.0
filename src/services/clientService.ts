import api from './api'
import type { Client } from '@/types/client'
import type { PaginatedResponse } from '@/types/common'
import type { Holding, FollowUp } from '@/types/holding'

export interface ClientListParams {
  page?: number
  pageSize?: number
  level?: string
  riskLevel?: string
  keyword?: string
}

export interface CreateFollowUpParams {
  type: string
  content: string
  createdBy: string
}

export const clientService = {
  getList(params: ClientListParams): Promise<PaginatedResponse<Client>> {
    return api.get('/clients', { params })
  },

  getDetail(id: string): Promise<Client> {
    return api.get(`/clients/${id}`)
  },

  getHoldings(id: string): Promise<Holding[]> {
    return api.get(`/clients/${id}/holdings`)
  },

  getFollowUps(id: string): Promise<FollowUp[]> {
    return api.get(`/clients/${id}/follow-ups`)
  },

  createFollowUp(id: string, data: CreateFollowUpParams): Promise<FollowUp> {
    return api.post(`/clients/${id}/follow-ups`, data)
  },
}
