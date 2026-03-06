/**
 * Agent Tools：封装现有 service，业务逻辑与 LLM 解耦
 * 所有数据通过 productService / clientService / dashboardService 获取（与 MSW 兼容）
 */

import { productService, type ProductWithHolderCount } from '@/services/productService'
import { clientService } from '@/services/clientService'
import { dashboardService } from '@/services/dashboardService'
import type { ToolDefinition, ToolResult, ParsedIntent } from '@/agent/types'
import type { TypeDistribution } from '@/types/common'

/** 通过关键词解析客户 ID（姓名匹配） */
async function resolveClientId(nameOrKeyword: string): Promise<string | null> {
  const { clients } = await dashboardService.search(nameOrKeyword)
  const byName = clients.find(
    (c) => c.name === nameOrKeyword || c.name.includes(nameOrKeyword)
  )
  return byName?.id ?? clients[0]?.id ?? null
}

/** 通过产品名或代码解析产品 ID */
async function resolveProductId(nameOrCode: string): Promise<string | null> {
  const { products } = await dashboardService.search(nameOrCode)
  const byCode = products.find((p) => p.code === nameOrCode)
  const byName = products.find(
    (p) => p.name === nameOrCode || p.name.includes(nameOrCode)
  )
  return byCode?.id ?? byName?.id ?? products[0]?.id ?? null
}

const tools: ToolDefinition[] = [
  {
    name: 'client_holdings',
    description: '查询某客户持有的产品列表',
    intentTypes: ['client_holdings'],
    execute: async (entities) => {
      const clientName = entities?.clientName
      if (!clientName) {
        return { success: false, toolName: 'client_holdings', error: '缺少客户名称' }
      }
      const clientId = await resolveClientId(clientName)
      if (!clientId) {
        return {
          success: true,
          toolName: 'client_holdings',
          data: { holdings: [], clientName },
          summary: `未找到客户「${clientName}」或该客户暂无持仓`,
        }
      }
      const holdings = await clientService.getHoldings(clientId)
      const topHoldings = holdings.slice(0, 5)
      const topSummary = topHoldings
        .map((h) => `${h.productName}（${h.productCode}）`)
        .join('、')
      const baseSummary = `客户「${clientName}」共持有 ${holdings.length} 只产品`
      const summary =
        topHoldings.length > 0
          ? `${baseSummary}，分别是：${topSummary}${holdings.length > topHoldings.length ? ' 等' : ''}`
          : baseSummary

      return {
        success: true,
        toolName: 'client_holdings',
        data: { clientId, clientName, holdings },
        summary,
      }
    },
  },
  {
    name: 'product_holders',
    description: '查询某产品被哪些客户持有',
    intentTypes: ['product_holders'],
    execute: async (entities) => {
      const productName = entities?.productName ?? entities?.productCode
      if (!productName) {
        return { success: false, toolName: 'product_holders', error: '缺少产品名称或代码' }
      }
      const productId = await resolveProductId(productName)
      if (!productId) {
        return {
          success: true,
          toolName: 'product_holders',
          data: { holders: [], productName },
          summary: `未找到产品「${productName}」或暂无持有人`,
        }
      }
      const holders = await productService.getHolders(productId)
      return {
        success: true,
        toolName: 'product_holders',
        data: { productId, productName, holders },
        summary: `产品「${productName}」被 ${holders.length} 位客户持有`,
      }
    },
  },
  {
    name: 'products_on_sale',
    description: '查询在售/募集中产品，可按类型筛选',
    intentTypes: ['products_on_sale'],
    execute: async (entities) => {
      const status = entities?.status ?? 'active'
      const type = entities?.productType
      const keyword = entities?.keyword
      const res = await productService.getList({
        page: 1,
        pageSize: 50,
        status: status as 'active' | 'raising',
        type,
        keyword,
      })
      return {
        success: true,
        toolName: 'products_on_sale',
        data: res,
        summary: `共 ${res.total} 只${status === 'raising' ? '募集中' : '在售'}产品`,
      }
    },
  },
  {
    name: 'dashboard_stats',
    description: '仪表盘概览数据',
    intentTypes: ['dashboard_stats'],
    execute: async () => {
      const stats = await dashboardService.getStats()
      return {
        success: true,
        toolName: 'dashboard_stats',
        data: stats,
        summary: `总产品 ${stats.totalProducts}，在售 ${stats.activeProducts}，客户 ${stats.totalClients}`,
      }
    },
  },
  {
    name: 'global_search',
    description: '全局搜索产品与客户',
    intentTypes: ['global_search'],
    execute: async (entities) => {
      const keyword = entities?.keyword ?? ''
      const result = await dashboardService.search(keyword)
      const total = result.products.length + result.clients.length
      return {
        success: true,
        toolName: 'global_search',
        data: result,
        summary: `搜索「${keyword}」：找到 ${result.products.length} 只产品、${result.clients.length} 位客户`,
      }
    },
  },
  {
    name: 'client_list',
    description: '客户列表，支持筛选',
    intentTypes: ['client_list'],
    execute: async (entities) => {
      const res = await clientService.getList({
        page: 1,
        pageSize: 20,
        keyword: entities?.keyword,
      })
      return {
        success: true,
        toolName: 'client_list',
        data: res,
        summary: `共 ${res.total} 位客户`,
      }
    },
  },
  {
    name: 'product_list',
    description: '产品列表，支持类型/状态筛选',
    intentTypes: ['product_list'],
    execute: async (entities) => {
      const res = await productService.getList({
        page: 1,
        pageSize: 20,
        type: entities?.productType,
        status: entities?.status,
        keyword: entities?.keyword,
      })
      return {
        success: true,
        toolName: 'product_list',
        data: res,
        summary: `共 ${res.total} 只产品`,
      }
    },
  },
  {
    name: 'chart_type_distribution',
    description: '按产品类型分组的规模占比图表',
    intentTypes: ['chart_type_distribution'],
    execute: async () => {
      const distribution = await dashboardService.getTypeDistribution()
      const totalScale = distribution.reduce((sum, d) => sum + d.scale, 0)
      const withPercent = distribution.map((d) => ({
        ...d,
        percent: totalScale > 0 ? d.scale / totalScale : 0,
      }))
      const sorted = [...withPercent].sort((a, b) => b.percent - a.percent)
      const topItems = sorted.length > 8 ? sorted.slice(0, 5) : sorted

      const summaryLines = topItems.map(
        (d) => `${d.label}: ${(d.percent * 100).toFixed(2)}%`
      )
      const summary = `按产品类型分组的规模占比如下（${topItems.length} 个类型）：\n` + summaryLines.join('\n')

      return {
        success: true,
        toolName: 'chart_type_distribution',
        data: {
          distribution,
          top: topItems,
        },
        summary,
      } as ToolResult<{
        distribution: TypeDistribution[]
        top: (TypeDistribution & { percent: number })[]
      }>
    },
  },
  {
    name: 'create_follow_up',
    description: '为客户创建跟进记录',
    intentTypes: ['create_follow_up'],
    execute: async (entities) => {
      const clientName = entities?.clientName
      const content = entities?.followUpContent ?? entities?.keyword
      const followUpType = (entities?.followUpType as 'phone' | 'visit' | 'wechat' | 'email') || 'phone'
      const createdBy = 'AI 助手'

      if (!clientName || !content) {
        return {
          success: false,
          toolName: 'create_follow_up',
          error: '缺少客户名称或跟进内容，无法创建跟进记录',
        }
      }

      const clientId = await resolveClientId(clientName)
      if (!clientId) {
        return {
          success: false,
          toolName: 'create_follow_up',
          error: `未找到客户「${clientName}」，无法创建跟进记录`,
        }
      }

      const followUp = await clientService.createFollowUp(clientId, {
        type: followUpType,
        content,
        createdBy,
      })

      return {
        success: true,
        toolName: 'create_follow_up',
        data: { clientId, clientName, followUp },
        summary: `已为客户「${clientName}」创建一条${followUpType === 'phone' ? '电话' : followUpType === 'visit' ? '拜访' : followUpType === 'wechat' ? '微信' : '邮件'}跟进：${content}`,
      }
    },
  },
  {
    name: 'summarize_risky_products',
    description: '整理高风险产品列表',
    intentTypes: ['summarize_risky_products'],
    execute: async () => {
      const res = await productService.getList({
        page: 1,
        pageSize: 200,
      })
      const all = res.data as ProductWithHolderCount[]
      const risky = all.filter((p) => p.riskLevel === 'high')
      const summaryList = risky.slice(0, 20).map((p) => `${p.name}（${p.code}，风险等级：高风险）`)
      const summary = risky.length
        ? `当前共 ${risky.length} 只高风险产品，示例：\n` + summaryList.join('\n')
        : '当前暂无标记为高风险的产品。'

      return {
        success: true,
        toolName: 'summarize_risky_products',
        data: { risky },
        summary,
      } as ToolResult<{ risky: ProductWithHolderCount[] }>
    },
  },
]

export { tools }
export type { ToolDefinition }
