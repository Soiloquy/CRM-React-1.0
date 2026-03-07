/**
 * Agent 聊天 Zustand Store
 * 管理消息、加载状态、推荐问题、对话摘要
 * 请求在 store action 中发起，组件卸载不影响进行中的请求
 */

import { create } from 'zustand'
import { agentService } from '@/services/agentService'
import type { AgentChatMessage, ChatMessage, ChartItem } from '@/agent/types'

// ─── 推荐问题池 ──────────────────────────────────────────────────────────────
const ALL_SUGGESTIONS = [
  '目前在售基金产品有多少？',
  '李芳持有哪些基金？',
  '帮我搜索一下华夏基金',
  '当前高风险产品有哪些？',
  '整体客户和产品情况怎么样？',
  '在售的股票型基金有哪些？',
  '帮我整理一下产品类型分布',
  '有哪些客户需要关注？',
]

function pickRandom(pool: string[], count: number, exclude: string[] = []): string[] {
  const available = pool.filter((s) => !exclude.includes(s))
  const source = available.length >= count ? available : pool
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ─── SessionStorage 持久化 ──────────────────────────────────────────────────
const STORAGE_KEY = 'agent_chat_store_v2'
const SUGGESTIONS_KEY = 'agent_suggestions_v1'

interface PersistedState {
  messages: AgentChatMessage[]
  summary: string
  lastSummarizedCount: number
}

// 加载持久化状态，查看SessionStorage中的数据
function loadPersistedState(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { messages: [], summary: '', lastSummarizedCount: 0 }
    const parsed = JSON.parse(raw)
    return {
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.filter((m: AgentChatMessage) => !m.isLoading)
        : [],
      summary: parsed.summary ?? '',
      lastSummarizedCount: parsed.lastSummarizedCount ?? 0,
    }
  } catch {
    return { messages: [], summary: '', lastSummarizedCount: 0 }
  }
}

// 加载推荐的问题
function loadSuggestions(): string[] {
  try {
    const raw = sessionStorage.getItem(SUGGESTIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === 3) return parsed
    }
  } catch {
    // ignore
  }
  const suggestions = pickRandom(ALL_SUGGESTIONS, 3)
  sessionStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions))
  return suggestions
}

// Store 类型 
interface AgentChatStore {
  messages: AgentChatMessage[]
  isLoading: boolean
  summary: string
  lastSummarizedCount: number
  suggestions: string[]

  sendMessage: (input: string) => Promise<void>
  refreshSuggestions: () => void
  clearMessages: () => void
}

// ─── 辅助：将 UI 消息转为后端 ChatMessage 格式 ──────────────────────────────
function toChatMessages(msgs: AgentChatMessage[]): ChatMessage[] {
  return msgs
    .filter((m) => !m.isLoading)
    .map((m) => ({ role: m.role, content: m.text }))
}

const RECENT_TURN_LIMIT = 10

// ─── Store 创建 ──────────────────────────────────────────────────────────────
const persisted = loadPersistedState()

export const useAgentChatStore = create<AgentChatStore>((set, get) => ({
  messages: persisted.messages,
  isLoading: false,
  summary: persisted.summary,
  lastSummarizedCount: persisted.lastSummarizedCount,
  suggestions: loadSuggestions(),

  sendMessage: async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed || get().isLoading) return

    const userMsg: AgentChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmed,
    }
    const loadingMsg: AgentChatMessage = {
      id: `${Date.now()}-loading`,
      role: 'assistant',
      text: '',
      isLoading: true,
    }

    set((s) => ({
      messages: [...s.messages, userMsg, loadingMsg],
      isLoading: true,
    }))

    try {
      const { messages, summary } = get()
      const chatMessages = toChatMessages(messages)
      const recentMessages = chatMessages.slice(-RECENT_TURN_LIMIT)

      const response = await agentService.sendMessage(recentMessages, summary || undefined)

      let chartData: ChartItem[] | undefined
      let chartTitle: string | undefined
      if (response.toolResults) {
        // 优先使用 generateChart 工具的结果（LLM 主动生成的动态图表）
        const chartResult = response.toolResults.find(
          (r) => r.toolName === 'generateChart'
        )
        if (chartResult) {
          const d = chartResult.data as {
            chartTitle?: string
            chartItems?: ChartItem[]
          }
          if (d?.chartItems?.length) {
            chartData = d.chartItems
            chartTitle = d.chartTitle ?? '图表'
          }
        }

        // 兜底：如果 LLM 没有调用 generateChart，但调用了 getTypeDistribution，也提取图表数据
        if (!chartData) {
          const distResult = response.toolResults.find(
            (r) => r.toolName === 'getTypeDistribution'
          )
          if (distResult) {
            const d = distResult.data as {
              distribution?: Array<{ label: string; scale: number }>
            }
            if (d?.distribution?.length) {
              chartData = d.distribution.map((item) => ({
                label: item.label,
                value: item.scale,
              }))
              chartTitle = '按产品类型分组的规模占比'
            }
          }
        }
      }

      const assistantMsg: AgentChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: response.content,
        chartData,
        chartTitle,
      }

      set((s) => ({
        messages: s.messages
          .filter((m) => !m.isLoading)
          .concat(assistantMsg),
        isLoading: false,
      }))

      persistState(get())
      maybeSummarize(get, set)
    } catch (err) {
      const errorMsg: AgentChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        text:
          err instanceof Error && err.message
            ? `抱歉，出了点问题：${err.message}`
            : '抱歉，服务暂时不可用，请稍后再试。',
      }

      set((s) => ({
        messages: s.messages.filter((m) => !m.isLoading).concat(errorMsg),
        isLoading: false,
      }))

      persistState(get())
    }
  },

  refreshSuggestions: () => {
    const current = get().suggestions
    const newSuggestions = pickRandom(ALL_SUGGESTIONS, 3, current)
    sessionStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(newSuggestions))
    set({ suggestions: newSuggestions })
  },

  clearMessages: () => {
    set({ messages: [], summary: '', lastSummarizedCount: 0 })
    sessionStorage.removeItem(STORAGE_KEY)
  },
}))

function persistState(state: AgentChatStore) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: state.messages.filter((m) => !m.isLoading),
        summary: state.summary,
        lastSummarizedCount: state.lastSummarizedCount,
      })
    )
  } catch {
    // ignore storage errors
  }
}

/** 当消息超过阈值时异步生成摘要，不阻塞 UI */
async function maybeSummarize(
  get: () => AgentChatStore,
  set: (partial: Partial<AgentChatStore> | ((s: AgentChatStore) => Partial<AgentChatStore>)) => void
) {
  const { messages, lastSummarizedCount, summary } = get()
  const visibleMessages = messages.filter((m) => !m.isLoading)

  if (visibleMessages.length - lastSummarizedCount <= RECENT_TURN_LIMIT) return

  const toSummarize = visibleMessages.slice(
    lastSummarizedCount,
    visibleMessages.length - RECENT_TURN_LIMIT
  )
  if (toSummarize.length === 0) return

  try {
    const chatMsgs = toChatMessages(toSummarize)
    if (summary) {
      chatMsgs.unshift({ role: 'system', content: `之前的摘要：${summary}` })
    }

    const newSummary = await agentService.summarize(chatMsgs)
    const newCount = visibleMessages.length - RECENT_TURN_LIMIT

    set({ summary: newSummary, lastSummarizedCount: newCount })
    persistState(get())
  } catch (err) {
    console.error('[AgentStore] 摘要生成失败：', err)
  }
}
