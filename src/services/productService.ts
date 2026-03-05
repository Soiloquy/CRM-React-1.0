import api from './api'
import type { Product } from '@/types/product'
import type { PaginatedResponse } from '@/types/common'
import type { Holding } from '@/types/holding'

export interface ProductListParams {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductWithHolderCount extends Product {
  holderCount: number
}

export interface ProductDetailExtra extends Product {
  holderCount: number
  totalHoldingAmount: number
  totalAumPercent: number
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
}

export const productService = {
  getList(params: ProductListParams): Promise<PaginatedResponse<ProductWithHolderCount>> {
    return api.get('/products', { params })
  },

  getDetail(id: string): Promise<ProductDetailExtra> {
    return api.get(`/products/${id}`)
  },

  getHolders(id: string): Promise<Holding[]> {
    return api.get(`/products/${id}/holders`)
  },
}
