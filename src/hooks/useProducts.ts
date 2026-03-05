import { useQuery } from '@tanstack/react-query'
import { productService, type ProductListParams } from '@/services/productService'

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getList(params),
    staleTime: 30_000,
  })
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useProductHolders(id: string) {
  return useQuery({
    queryKey: ['product-holders', id],
    queryFn: () => productService.getHolders(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}
