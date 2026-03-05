import { useMutation } from '@tanstack/react-query'
import { agentService } from '@/services/agentService'
import type { AgentExecutionResult } from '@/agent/types'

/**
 * 与 React Query 结合的 Agent 调用
 * 使用 useMutation：每次用户发送为一次 mutation，便于 loading/error/success 状态与缓存策略
 */
export function useAgent() {
  return useMutation({
    mutationFn: (query: string) => agentService.run(query),
    onError: (err: Error) => {
      console.error('[useAgent]', err)
    },
  })
}

export type { AgentExecutionResult }
