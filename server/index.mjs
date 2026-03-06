import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.AGENT_SERVER_PORT || 4000

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173']
const envOrigins = process.env.AGENT_CORS_ORIGIN
  ? process.env.AGENT_CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : []
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
}))
app.use(express.json({ limit: '1mb' }))

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一个CRM销售AI助手，帮助渠道销售团队管理基金产品信息和客户关系。
你的用户是渠道销售人员。你可以使用提供的工具来帮助用户：
- 查询客户持仓信息
- 查询产品被哪些客户持有
- 搜索在售产品、客户列表
- 查看仪表盘统计数据
- 创建客户跟进记录
- 分析高风险产品
- 回答销售相关问题和日常聊天

注意事项：
- 回答要简洁明了，使用中文
- 当用户问业务数据相关问题时，使用工具获取真实数据后回答
- 不要编造具体的客户或产品数据
- 可以给出销售建议和话术参考
- 当工具返回数据后，用自然语言总结数据要点
- 当用户要求画图、生成图表、可视化数据时，你必须先调用数据工具获取数据，然后根据获取到的数据调用 generateChart 工具来生成图表，将处理后的数据以 { label, value } 格式传入 items 参数`

// ─── Function Calling Tool Definitions ───────────────────────────────────────
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'getClientHoldings',
      description: '查询某个客户持有哪些基金产品。当用户问某个客户买了什么、持有什么、持仓情况时调用。',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: '客户姓名' },
        },
        required: ['clientName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductHolders',
      description: '查询某个产品被哪些客户持有。当用户问某个产品被谁买了、有哪些客户持有时调用。',
      parameters: {
        type: 'object',
        properties: {
          productName: { type: 'string', description: '产品名称或代码' },
        },
        required: ['productName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductsOnSale',
      description: '查询在售或募集中的产品列表，可按类型筛选。',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'raising'], description: '产品状态：active=在售，raising=募集中' },
          productType: { type: 'string', enum: ['equity', 'bond', 'hybrid', 'money_market', 'index', 'qdii'], description: '产品类型' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDashboardStats',
      description: '获取仪表盘概览数据，包括总产品数、在售产品数、总客户数、本月新增客户数等。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'globalSearch',
      description: '全局搜索产品和客户。当用户想搜索某个关键词时调用。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getClientList',
      description: '查询客户列表，可带关键词筛选。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductList',
      description: '查询产品列表，可按类型和状态筛选。',
      parameters: {
        type: 'object',
        properties: {
          productType: { type: 'string', description: '产品类型' },
          status: { type: 'string', description: '产品状态' },
          keyword: { type: 'string', description: '搜索关键词' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTypeDistribution',
      description: '获取按产品类型分组的规模占比数据，用于生成饼图。当用户要求生成产品类型分布图表时调用。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createFollowUp',
      description: '为某个客户创建跟进记录。需要客户名和跟进内容。',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: '客户姓名' },
          followUpType: { type: 'string', enum: ['phone', 'visit', 'wechat', 'email'], description: '跟进类型，默认 phone' },
          content: { type: 'string', description: '跟进内容' },
        },
        required: ['clientName', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarizeRiskyProducts',
      description: '整理当前高风险产品列表和信息。当用户问高风险产品、风险情况时调用。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generateChart',
      description: '生成饼图/图表来可视化数据。当用户要求画图、生成图表、可视化时，先用其他工具获取数据，然后调用此工具将处理好的数据生成图表。每个 item 代表饼图的一个扇区。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '图表标题' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: '标签名称' },
                value: { type: 'number', description: '数值' },
              },
              required: ['label', 'value'],
            },
            description: '图表数据项数组',
          },
        },
        required: ['title', 'items'],
      },
    },
  },
]

// ─── DeepSeek API Caller ─────────────────────────────────────────────────────
async function callDeepSeek(messages, includeTools = true) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未配置')

  const body = { model, messages }
  if (includeTools) {
    body.tools = TOOL_DEFINITIONS
  }

  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('[agent-server] LLM error:', resp.status, text)
    throw new Error(`LLM 请求失败：${resp.status}`)
  }

  const json = await resp.json()
  return json?.choices?.[0]?.message
}

// ─── Unified Endpoint ────────────────────────────────────────────────────────
app.post('/agent/chat', async (req, res) => {
  const { messages, summary, mode } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 字段不能为空' })
  }

  try {
    // ── Summarize mode ──
    if (mode === 'summarize') {
      const summaryMessages = [
        {
          role: 'system',
          content: '请用2-3句简洁的中文总结以下对话的要点，保留关键信息（客户名、产品名、数据结论等）。只输出总结内容，不要有多余文字。',
        },
        ...messages,
      ]
      const result = await callDeepSeek(summaryMessages, false)
      return res.json({ type: 'summary', content: result?.content ?? '' })
    }

    // ── Chat mode: build full message array ──
    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }]

    if (summary) {
      fullMessages.push({
        role: 'system',
        content: `以下是之前对话的摘要，供你参考上下文：\n${summary}`,
      })
    }

    fullMessages.push(...messages)

    const result = await callDeepSeek(fullMessages)

    if (!result) {
      throw new Error('LLM 返回内容为空')
    }

    // LLM wants to call tools → return tool_calls to frontend for execution
    if (result.tool_calls && result.tool_calls.length > 0) {
      const toolCalls = result.tool_calls.map((tc) => {
        let args = {}
        try {
          args = JSON.parse(tc.function.arguments || '{}')
        } catch {
          args = {}
        }
        return { id: tc.id, name: tc.function.name, arguments: args }
      })

      return res.json({
        type: 'tool_calls',
        toolCalls,
        assistantMessage: result,
      })
    }

    // Plain text response
    return res.json({
      type: 'message',
      content: result.content ?? '',
    })
  } catch (err) {
    console.error('[agent-server] 处理失败：', err)
    return res.status(500).json({ error: err.message || '处理失败，请稍后重试' })
  }
})

app.listen(PORT, () => {
  console.log(`[agent-server] 已启动，端口 ${PORT}`)
})
