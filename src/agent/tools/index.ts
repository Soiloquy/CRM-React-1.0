/**
 * Agent Tools：封装现有 service，前端本地执行工具
 * 后端 Function Calling 返回 tool_calls 后，由前端在此执行并返回结果
 */

import { productService, type ProductWithHolderCount } from '@/services/productService'
import { clientService } from '@/services/clientService'
import { dashboardService } from '@/services/dashboardService'
import type { AgentTool, AgentToolResult } from '@/agent/types'
import type { TypeDistribution } from '@/types/common'

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

export const tools: AgentTool[] = [
  {
    name: 'getClientHoldings',
    execute: async (args) => {
      const clientName = args.clientName as string | undefined
      if (!clientName) {
        return { success: false, error: '缺少客户名称' }
      }
      const clientId = await resolveClientId(clientName)
      if (!clientId) {
        return {
          success: true,
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

      return { success: true, data: { clientId, clientName, holdings }, summary }
    },
  },
  {
    name: 'getProductHolders',
    execute: async (args) => {
      const productName = (args.productName ?? args.productCode) as string | undefined
      if (!productName) {
        return { success: false, error: '缺少产品名称或代码' }
      }
      const productId = await resolveProductId(productName)
      if (!productId) {
        return {
          success: true,
          data: { holders: [], productName },
          summary: `未找到产品「${productName}」或暂无持有人`,
        }
      }
      const holders = await productService.getHolders(productId)
      return {
        success: true,
        data: { productId, productName, holders },
        summary: `产品「${productName}」被 ${holders.length} 位客户持有`,
      }
    },
  },
  {
    name: 'getProductsOnSale',
    execute: async (args) => {
      const status = (args.status as string) ?? 'active'
      const type = args.productType as string | undefined
      const res = await productService.getList({
        page: 1,
        pageSize: 50,
        status: status as 'active' | 'raising',
        type,
      })
      return {
        success: true,
        data: res,
        summary: `共 ${res.total} 只${status === 'raising' ? '募集中' : '在售'}产品`,
      }
    },
  },
  {
    name: 'getDashboardStats',
    execute: async () => {
      const stats = await dashboardService.getStats()
      return {
        success: true,
        data: stats,
        summary: `总产品 ${stats.totalProducts}，在售 ${stats.activeProducts}，客户 ${stats.totalClients}`,
      }
    },
  },
  {
    name: 'globalSearch',
    execute: async (args) => {
      const keyword = (args.keyword as string) ?? ''
      const result = await dashboardService.search(keyword)
      return {
        success: true,
        data: result,
        summary: `搜索「${keyword}」：找到 ${result.products.length} 只产品、${result.clients.length} 位客户`,
      }
    },
  },
  {
    name: 'getClientList',
    execute: async (args) => {
      const res = await clientService.getList({
        page: 1,
        pageSize: 20,
        keyword: args.keyword as string | undefined,
      })
      return { success: true, data: res, summary: `共 ${res.total} 位客户` }
    },
  },
  {
    name: 'getProductList',
    execute: async (args) => {
      const res = await productService.getList({
        page: 1,
        pageSize: 20,
        type: args.productType as string | undefined,
        status: args.status as string | undefined,
        keyword: args.keyword as string | undefined,
      })
      return { success: true, data: res, summary: `共 ${res.total} 只产品` }
    },
  },
  {
    name: 'getTypeDistribution',
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
      const summary =
        `按产品类型分组的规模占比（${topItems.length} 个类型）：\n` +
        summaryLines.join('\n')

      return {
        success: true,
        data: { distribution, top: topItems },
        summary,
      } as AgentToolResult & {
        data: {
          distribution: TypeDistribution[]
          top: (TypeDistribution & { percent: number })[]
        }
      }
    },
  },
  {
    name: 'createFollowUp',
    execute: async (args) => {
      const clientName = args.clientName as string | undefined
      const content = args.content as string | undefined
      const followUpType =
        (args.followUpType as 'phone' | 'visit' | 'wechat' | 'email') || 'phone'

      if (!clientName || !content) {
        return { success: false, error: '缺少客户名称或跟进内容' }
      }

      const clientId = await resolveClientId(clientName)
      if (!clientId) {
        return { success: false, error: `未找到客户「${clientName}」` }
      }

      const followUp = await clientService.createFollowUp(clientId, {
        type: followUpType,
        content,
        createdBy: 'AI 助手',
      })

      const typeLabel =
        followUpType === 'phone'
          ? '电话'
          : followUpType === 'visit'
            ? '拜访'
            : followUpType === 'wechat'
              ? '微信'
              : '邮件'

      return {
        success: true,
        data: { clientId, clientName, followUp },
        summary: `已为客户「${clientName}」创建一条${typeLabel}跟进：${content}`,
      }
    },
  },
  {
    name: 'summarizeRiskyProducts',
    execute: async () => {
      const res = await productService.getList({ page: 1, pageSize: 200 })
      const all = res.data as ProductWithHolderCount[]
      const risky = all.filter((p) => p.riskLevel === 'high')
      const summaryList = risky
        .slice(0, 20)
        .map((p) => `${p.name}（${p.code}，风险等级：高风险）`)
      const summary = risky.length
        ? `当前共 ${risky.length} 只高风险产品：\n` + summaryList.join('\n')
        : '当前暂无标记为高风险的产品。'

      return { success: true, data: { risky }, summary }
    },
  },
  {
    name: 'generateChart',
    execute: async (args) => {
      const title = args.title as string
      const items = args.items as Array<{ label: string; value: number }>
      return {
        success: true,
        data: { chartTitle: title, chartItems: items },
        summary: `已生成图表：${title}`,
      }
    },
  },
]
