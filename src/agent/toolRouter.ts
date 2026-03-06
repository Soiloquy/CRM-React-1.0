/**
 * Tool 路由器：根据 ParsedIntent 选择并执行对应 Tool
 * 废弃的tool，用于显示Agent推理步骤的
 */

import type { ParsedIntent, ToolResult,ReasoningStep } from './types'
import { tools } from './tools'

function createStep(step: number, phase: ReasoningStep['phase'], message: string, payload?: unknown): ReasoningStep {
  return { step, phase, message, payload, timestamp: Date.now() }
}

/**
 * 根据意图选择 Tool 并执行，返回结果与推理步骤
 */
export async function routeAndExecute(intent: ParsedIntent): Promise<{
  result: ToolResult | null
  reasoning: ReasoningStep[]
}> {
  const reasoning: ReasoningStep[] = []

  if (intent.type === 'unknown') {
    reasoning.push(createStep(1, 'route', '未识别到有效意图，无法选择工具', { intent }))
    return { result: null, reasoning }
  }

  const tool = tools.find((t) => t.intentTypes.includes(intent.type))
  if (!tool) {
    reasoning.push(createStep(1, 'route', `意图「${intent.type}」暂无对应工具`, { intent }))
    return { result: null, reasoning }
  }

  reasoning.push(createStep(1, 'route', `已选择工具：${tool.name}（${tool.description}）`, { toolName: tool.name }))
  reasoning.push(createStep(2, 'tool', `执行参数：${JSON.stringify(intent.entities ?? {})}`))

  let result: ToolResult
  try {
    result = await tool.execute(intent.entities)
    reasoning.push(
      createStep(3, 'tool', result.success ? `执行成功：${result.summary ?? '完成'}` : `执行失败：${result.error}`, result)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result = { success: false, toolName: tool.name, error: message }
    reasoning.push(createStep(3, 'tool', `执行异常：${message}`, { error: message }))
  }

  return { result, reasoning }
}
