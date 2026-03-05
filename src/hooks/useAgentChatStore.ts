import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { TypeDistribution } from '@/types/common'

export interface AgentChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  chartData?: TypeDistribution[]
  chartTitle?: string
}

const STORAGE_KEY = 'agent_chat_messages_v1'

function loadInitialMessages(): AgentChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 简单校验结构，避免历史脏数据导致异常
    return parsed.map((m) => ({
      id: String(m.id ?? ''),
      role: m.role === 'assistant' ? 'assistant' : 'user',
      text: String(m.text ?? ''),
      chartData: m.chartData,
      chartTitle: m.chartTitle,
    }))
  } catch {
    return []
  }
}

export function useAgentChatStore(): {
  messages: AgentChatMessage[]
  setMessages: Dispatch<SetStateAction<AgentChatMessage[]>>
  clearMessages: () => void
} {
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => loadInitialMessages())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore storage errors（如容量不足）
    }
  }, [messages])

  const clearMessages = () => setMessages([])

  return { messages, setMessages, clearMessages }
}

