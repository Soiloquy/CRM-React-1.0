import { create } from 'zustand'
import type { ProductType, ProductStatus } from '@/types/product'
import type { ClientLevel, ClientRiskLevel } from '@/types/client'

interface FilterState {
  productFilters: {
    type: ProductType | ''
    status: ProductStatus | ''
    keyword: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  clientFilters: {
    level: ClientLevel | ''
    riskLevel: ClientRiskLevel | ''
    keyword: string
  }
  setProductFilter: (filters: Partial<FilterState['productFilters']>) => void
  setClientFilter: (filters: Partial<FilterState['clientFilters']>) => void
  resetProductFilters: () => void
  resetClientFilters: () => void
  hasActiveProductFilters: () => boolean
}

const defaultProductFilters = {
  type: '' as const,
  status: 'active' as const,
  keyword: '',
  sortBy: '',
  sortOrder: 'desc' as const,
}
const defaultClientFilters = { 
  level: '' as const,
  riskLevel: '' as const,
  keyword: '' 
}

export const useFilterStore = create<FilterState>((set, get) => ({
  productFilters: { ...defaultProductFilters },
  clientFilters: { ...defaultClientFilters },
  setProductFilter: (filters) =>
    set((state) => ({
      productFilters: { ...state.productFilters, ...filters },
    })),
  setClientFilter: (filters) =>
    set((state) => ({
      clientFilters: { ...state.clientFilters, ...filters },
    })),
  resetProductFilters: () =>
    set({ productFilters: { ...defaultProductFilters } }),
  resetClientFilters: () =>
    set({ clientFilters: { ...defaultClientFilters } }),
  hasActiveProductFilters: () => {
    const f = get().productFilters
    return !!(f.type || f.keyword || f.sortBy || (f.status && f.status !== 'active'))
  },
}))
