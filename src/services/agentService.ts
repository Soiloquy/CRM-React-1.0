/**
 * Agent 服务层：统一调用 AgentController
 * 可与 MSW 结合：后续可改为 api.post('/agent/run', { query }) 并在 mocks 中 mock
 */

import { runAgent } from '@/agent/agentController'
import type { AgentExecutionResult } from '@/agent/types'

export const agentService = {
  /**
   * 执行自然语言指令，返回结构化结果与推理过程
   */
  run(query: string): Promise<AgentExecutionResult> {
    return runAgent(query)
  },
}
