/**
 * Agent 层类型定义
 * 业务逻辑与 LLM 解耦：Intent / Tool 为结构化契约，解析实现可替换（规则 / LLM）
 */

/** 推理步骤：用于可观测 */
export interface ReasoningStep {
  step: number
  phase: 'intent' | 'route' | 'tool' | 'result'
  message: string
  payload?: unknown
  timestamp: number
}

/** 意图类型：与业务能力一一对应 */
export type IntentType =
  | 'client_holdings'       // 某客户持有哪些产品
  | 'product_holders'       // 某产品被哪些客户持有
  | 'products_on_sale'      // 在售产品（可带类型/关键词）
  | 'client_list'           // 客户列表（可带筛选）
  | 'product_list'          // 产品列表（可带筛选）
  | 'dashboard_stats'       // 仪表盘概览
  | 'global_search'         // 全局搜索
  | 'client_detail'         // 客户详情
  | 'product_detail'        // 产品详情
  | 'chart_type_distribution' // 生成按产品类型分组的规模占比图表
  | 'create_follow_up'      // 新增客户跟进记录
  | 'summarize_risky_products' // 整理高风险产品信息
  | 'chitchat'              // 普通聊天 / 闲聊
  | 'unknown'

/** 解析后的结构化意图 */
export interface ParsedIntent {
  type: IntentType
  /** 实体：客户名/产品名/关键词等 */
  entities?: {
    clientName?: string
    productName?: string
    productCode?: string
    keyword?: string
    productType?: string
    status?: string
    /** 跟进类型：phone / visit / wechat / email */
    followUpType?: string
    /** 跟进内容 */
    followUpContent?: string
    /** 跟进发生时间（自然语言或 ISO 字符串） */
    followUpTime?: string
  }
  /** 原始用户输入（便于追溯） */
  rawInput: string
  /** 置信度 0-1，规则版可为 1 或 0 */
  confidence: number
}

/** Tool 执行结果：统一结构 */
export interface ToolResult<T = unknown> {
  success: boolean
  toolName: string
  data?: T
  error?: string
  /** 用于展示的摘要（如「查询到 3 条产品」） */
  summary?: string
}

/** Agent 执行结果：Controller 统一返回 */
export interface AgentExecutionResult<T = unknown> {
  success: boolean
  intent: ParsedIntent
  result?: ToolResult<T>
  /** 推理过程（可观测） */
  reasoning: ReasoningStep[]
  /** 面向用户的回复文案 */
  message: string
  error?: string
}

/** Tool 元数据：注册与路由用 */
export interface ToolDefinition {
  name: string
  description: string
  intentTypes: IntentType[]
  /** 执行函数：参数来自 ParsedIntent.entities */
  execute: (entities: ParsedIntent['entities']) => Promise<ToolResult>
}
