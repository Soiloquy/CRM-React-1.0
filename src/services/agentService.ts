/**
 * Agent 服务层：调用后端统一 /agent/chat 接口 + 前端本地执行工具
 * 处理 Function Calling 的多轮交互循环
 */

import type {
  ChatMessage,
  AgentChatResponse,
  ToolCallInfo,
  AgentToolResult,
} from '@/agent/types'
import { tools } from '@/agent/tools'

const AGENT_BASE_URL = 'http://localhost:4000'

async function callAgentAPI(body: {
  messages: ChatMessage[]
  summary?: string
  mode?: 'chat' | 'summarize'
}): Promise<AgentChatResponse> {
  const resp = await fetch(`${AGENT_BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || `请求失败：${resp.status}`)
  }
  return resp.json()
}

async function executeToolLocally(
  toolCall: ToolCallInfo
): Promise<AgentToolResult> {
  const tool = tools.find((t) => t.name === toolCall.name)
  if (!tool) {
    return { success: false, error: `未找到工具：${toolCall.name}` }
  }
  try {
    return await tool.execute(toolCall.arguments as Record<string, unknown>)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export interface AgentServiceResponse {
  content: string
  toolResults?: Array<{ toolName: string; data: unknown }>
}

export const agentService = {
  /**
   * 发送消息并处理完整的 Function Calling 循环
   * 最多迭代 3 次（防止无限工具调用）
   */
  async sendMessage(
    messages: ChatMessage[],
    summary?: string
  ): Promise<AgentServiceResponse> {
    const MAX_ITERATIONS = 3
    let currentMessages = [...messages]
    const allToolResults: Array<{ toolName: string; data: unknown }> = []

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await callAgentAPI({
        messages: currentMessages,
        summary,
      })

      if (response.type === 'message') {
        return {
          content: response.content ?? '',
          toolResults: allToolResults.length > 0 ? allToolResults : undefined,
        }
      }

      if (response.type === 'tool_calls' && response.toolCalls) {
        const toolResultMessages: ChatMessage[] = []

        for (const tc of response.toolCalls) {
          const result = await executeToolLocally(tc)
          allToolResults.push({ toolName: tc.name, data: result.data })
          toolResultMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          })
        }

        currentMessages = [
          ...currentMessages,
          response.assistantMessage!,
          ...toolResultMessages,
        ]

        continue
      }

      break
    }

    throw new Error('工具调用循环未能产生最终回复')
  },

  /** 生成对话摘要 */
  async summarize(messages: ChatMessage[]): Promise<string> {
    const response = await callAgentAPI({ messages, mode: 'summarize' })
    return response.content ?? ''
  },
}
