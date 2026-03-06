/** 通用图表数据项 */
export interface ChartItem {
  label: string
  value: number
}

/** 发送给后端的聊天消息格式（OpenAI 兼容） */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

/** 后端返回的 tool call 信息 */
export interface ToolCallInfo {
  id: string
  name: string
  arguments: Record<string, unknown>
}

/** 后端统一响应 */
export interface AgentChatResponse {
  type: 'message' | 'tool_calls' | 'summary'
  content?: string
  toolCalls?: ToolCallInfo[]
  assistantMessage?: ChatMessage
}

/** 前端 Agent 工具定义 */
export interface AgentTool {
  name: string
  execute: (args: Record<string, unknown>) => Promise<AgentToolResult>
}

/** 工具执行结果 */
export interface AgentToolResult {
  success: boolean
  data?: unknown
  error?: string
  summary?: string
}

/** 前端聊天消息（UI 展示用） */
export interface AgentChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  chartData?: ChartItem[]
  chartTitle?: string
  /** 骨架加载消息 */
  isLoading?: boolean
}
