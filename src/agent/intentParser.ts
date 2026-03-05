/**
 * 意图解析器：将用户自然语言转为结构化 Intent
 * 当前为规则/关键词实现，可与 LLM 解耦并后续替换为 LLM 解析
 */

import type { ParsedIntent } from './types'

/** 抽取实体：客户名 / 产品名 / 关键词（简单按引号或“的”前名词） */
function extractEntities(input: string): ParsedIntent['entities'] {
  const trimmed = input.trim()
  const entities: NonNullable<ParsedIntent['entities']> = {}

  // “XXX持有哪些” -> clientName = XXX
  const holdMatch = trimmed.match(/(?:^|[\s，,]+)([^\s，,]+?)(?:持有哪些|买了哪些|持有啥|的持仓)/)
  if (holdMatch) {
    entities.clientName = holdMatch[1].replace(/[?？]/g, '').trim()
  }

  // “XXX被谁持有” / “谁买了XXX” -> productName 或 productCode
  const whoHoldsMatch = trimmed.match(/(?:^|[\s，,]+)([^\s，,]+?)(?:被谁持有|谁持有|谁买了|有哪些客户持有)/)
  if (whoHoldsMatch) {
    const v = whoHoldsMatch[1].replace(/[?？]/g, '').trim()
    if (/^[A-Z0-9]+$/i.test(v)) entities.productCode = v
    else entities.productName = v
  }

  // 在售 / 募集中 等
  if (/\b在售\b|当前在售|正在卖/.test(trimmed)) entities.status = 'active'
  if (/\b募集中\b/.test(trimmed)) entities.status = 'raising'

  // 类型：股票型、债券型、混合型、货币型、指数型、QDII
  const typeMap: Record<string, string> = {
    股票型: 'equity',
    债券型: 'bond',
    混合型: 'hybrid',
    货币型: 'money_market',
    指数型: 'index',
    QDII: 'qdii',
  }
  for (const [label, type] of Object.entries(typeMap)) {
    if (trimmed.includes(label)) {
      entities.productType = type
      break
    }
  }

  // 通用关键词：去掉问号、常见停用词
  const forSearch = trimmed.replace(/[?？。，,！!]/g, '').trim()
  if (forSearch.length >= 1 && !entities.clientName && !entities.productName && !entities.productCode) {
    entities.keyword = forSearch
  }

  return Object.keys(entities).length ? entities : undefined
}

/**
 * 解析用户输入为 ParsedIntent（规则版，本地兜底）
 * 可替换实现：例如调用 LLM 返回同结构 JSON
 */
export function parseIntent(rawInput: string): ParsedIntent {
  const input = rawInput.trim()
  const lower = input.toLowerCase()

  if (!input) {
    return {
      type: 'unknown',
      rawInput: input,
      confidence: 0,
    }
  }

  const entities = extractEntities(input)

  // 纯聊天 / 问候类：优先识别为 chitchat
  if (/(你好|hello|hi|早上好|下午好|晚上好|你是谁|介绍一下你|聊聊天|随便聊聊)/i.test(input)) {
    return {
      type: 'chitchat',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 客户持仓：XXX持有哪些 / 张三买了哪些基金
  if (/\S+\s*(?:持有哪些|买了哪些|持有啥|的持仓|买了什么)/.test(input) && entities?.clientName) {
    return {
      type: 'client_holdings',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 产品持有人：XXX被谁持有 / 谁买了XXX
  if (/(?:被谁持有|谁持有|谁买了|有哪些客户持有)/.test(input) && (entities?.productName || entities?.productCode)) {
    return {
      type: 'product_holders',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 在售产品 / 在售的XXX型基金
  if (/\b在售\b|当前在售|正在卖|募集中/.test(input)) {
    return {
      type: 'products_on_sale',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 仪表盘 / 概览 / 数据总览
  if (/\b(?:仪表盘|概览|总览|数据总览|整体情况|有多少客户|多少产品)\b/.test(input)) {
    return {
      type: 'dashboard_stats',
      entities: { keyword: input },
      rawInput: input,
      confidence: 1,
    }
  }

  // 全局搜索：查一下XXX / 搜索XXX
  if (/\b(?:查一下|搜索|查找|搜一下)\s*[\s\S]+/.test(input) || (entities?.keyword && input.length <= 30)) {
    const kw = entities?.keyword ?? input.replace(/^(?:查一下|搜索|查找|搜一下)\s*/i, '').trim()
    return {
      type: 'global_search',
      entities: { ...entities, keyword: kw },
      rawInput: input,
      confidence: 1,
    }
  }

  // 客户列表 / 有哪些客户
  if (/\b(?:客户列表|有哪些客户|客户名单)\b/.test(input)) {
    return {
      type: 'client_list',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 产品列表 / 产品货架
  if (/\b(?:产品列表|产品货架|有哪些产品)\b/.test(input)) {
    return {
      type: 'product_list',
      entities,
      rawInput: input,
      confidence: 1,
    }
  }

  // 默认：根据关键词内容决定是全局搜索还是纯聊天
  if (entities?.keyword) {
    const kw = entities.keyword
    // 如果包含明显的业务关键词，则走搜索；否则当成聊天
    if (/(基金|产品|客户|持仓|持有|认购|净值|风险|收益|回报)/.test(kw)) {
      return {
        type: 'global_search',
        entities,
        rawInput: input,
        confidence: 0.8,
      }
    }

    return {
      type: 'chitchat',
      entities,
      rawInput: input,
      confidence: 0.8,
    }
  }

  return {
    type: 'unknown',
    entities,
    rawInput: input,
    confidence: 0,
  }
}

/**
 * 使用后端 Express + 真实 LLM 的解析结果（推荐主通路）
 * 后端地址：http://localhost:4000/agent/parse-intent（见 server/index.mjs）
 */
export async function parseIntentLLM(rawInput: string): Promise<ParsedIntent | null> {
  const input = rawInput.trim()
  if (!input) {
    return {
      type: 'unknown',
      rawInput: input,
      confidence: 0,
      entities: {},
    }
  }

  try {
    const resp = await fetch('http://localhost:4000/agent/parse-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    if (!resp.ok) {
      console.error('[Agent] LLM intent API error:', resp.status)
      return null
    }

    const data = await resp.json()
    return {
      type: data.type ?? 'unknown',
      entities: data.entities ?? {},
      rawInput: input,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
    }
  } catch (e) {
    console.error('[Agent] 调用 LLM Intent 失败:', e)
    return null
  }
}

