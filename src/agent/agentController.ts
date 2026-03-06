/**
 * Agent 统一入口：解析意图 → 路由执行 → 返回结构化结果与推理过程
 * 统一异常处理，保证行为可控、可观测、可替换
 */

import { parseIntent, parseIntentLLM} from './intentParser'
import type {  ParsedIntent,AgentExecutionResult,ReasoningStep } from './types'
import { routeAndExecute } from './toolRouter'

// 简单的会话上下文，用于处理“分别是什么 / 有哪些”这类后续提问
const lastContext: {
  clientName?: string
  intentType?: 'client_holdings' | 'product_holders'
} = {}

function buildUserMessage(intent: ParsedIntent, result: { success: boolean; summary?: string; error?: string } | null): string {
  if (intent.type === 'unknown') {
    return '没有理解您的意思，您可以试试：「张三持有哪些基金」「在售的股票型基金有哪些」「某某产品被谁持有」等。'
  }
  if (!result) {
    return '暂不支持该类型的查询，请换一种说法试试。'
  }
  if (!result.success) {
    return `执行出错：${result.error ?? '未知错误'}`
  }
  return result.summary ?? '查询完成。'
}

/**
 * 执行用户自然语言指令，返回结构化结果与推理过程
 */
export async function runAgent(userInput: string): Promise<AgentExecutionResult> {
  const reasoning: ReasoningStep[] = []
  const t0 = Date.now()

  // 1. 意图解析（优先走 LLM，失败时回退本地规则）
  let intent = parseIntent(userInput)
  try {
    const llmIntent = await parseIntentLLM(userInput)
    // 只要 LLM 识别出了非 unknown 的意图，就优先采用 LLM 的结果
    if (llmIntent && llmIntent.type !== 'unknown') {
      intent = llmIntent
    }
  } catch (e) {
    console.error('[Agent] LLM intent fallback to rule-based:', e)
  }
  reasoning.push({
    step: 0,
    phase: 'intent',
    message: `解析意图：${intent.type}（置信度 ${intent.confidence}）`,
    payload: { type: intent.type, entities: intent.entities },
    timestamp: Date.now(),
  })

  if (intent.type === 'unknown' && intent.confidence === 0) {
    return {
      success: false,
      intent,
      reasoning,
      message: buildUserMessage(intent, null),
    }
  }

  // 1.5 基于最近一次上下文做简单指代解析
  const trimmed = userInput.trim()
  if (
    /(分别是什么|有哪些|是哪些|都有哪些|都是什么)/.test(trimmed) &&
    !intent.entities?.clientName &&
    lastContext.intentType === 'client_holdings' &&
    lastContext.clientName
  ) {
    intent = {
      type: 'client_holdings',
      entities: { clientName: lastContext.clientName },
      rawInput: userInput,
      confidence: Math.max(intent.confidence, 0.9),
    }
  }

  // 2. 如果是普通聊天意图，直接调用聊天接口返回结果
  if (intent.type === 'chitchat') {
    try {
      const resp = await fetch('http://localhost:4000/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      })
      if (!resp.ok) {
        const text = await resp.text()
        console.error('[Agent] chat api error:', resp.status, text)
        return {
          success: false,
          intent,
          reasoning,
          message: '聊天服务暂时不可用，请稍后再试。',
          error: `chat api error: ${resp.status}`,
        }
      }
      const data = await resp.json()
      const msg = typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : '好的。'
      return {
        success: true,
        intent,
        reasoning,
        message: msg,
      }
    } catch (e) {
      console.error('[Agent] 调用聊天接口失败:', e)
      return {
        success: false,
        intent,
        reasoning,
        message: '聊天服务暂时不可用，请稍后再试。',
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }

  // 3. 路由并执行工具
  const { result, reasoning: routeReasoning } = await routeAndExecute(intent)
  reasoning.push(...routeReasoning)

  // 3.5 更新简单会话上下文
  if (result?.success) {
    if (intent.type === 'client_holdings' && intent.entities?.clientName) {
      lastContext.clientName = intent.entities.clientName
      lastContext.intentType = 'client_holdings'
    }
  }

  // 4. 生成面向用户的回复
  const message = buildUserMessage(intent, result ?? null)

  const success = result?.success ?? false
  const error = result?.error

  return {
    success,
    intent,
    result: result ?? undefined,
    reasoning,
    message,
    error,
  }
}
