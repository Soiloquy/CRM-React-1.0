// 简单的 Node.js + Express Agent 服务
// 职责：调用真实 LLM（此处使用 DeepSeek OpenAI 兼容接口），
//       将自然语言解析为前端约定的 ParsedIntent 结构
// 注意：需要先安装依赖：npm install express cors dotenv

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.AGENT_SERVER_PORT || 4000

// 允许多个前端来源：支持逗号分隔的 AGENT_CORS_ORIGIN，默认放通 3000 和 5173
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173']
const envOrigins = process.env.AGENT_CORS_ORIGIN
  ? process.env.AGENT_CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : []
// 合并默认与 .env 中的来源，去重，避免配置遗漏某个端口
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

// #region agent log
fetch('http://127.0.0.1:7354/ingest/f8e362e3-15ae-4816-b5e9-10f749463924', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': 'bd63c5',
  },
  body: JSON.stringify({
    sessionId: 'bd63c5',
    runId: 'cors-pre-fix',
    hypothesisId: 'H1',
    location: 'server/index.mjs:20',
    message: 'CORS init allowedOrigins',
    data: { envOrigins, allowedOrigins },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

app.use(cors({
  origin(origin, callback) {
    // 开发环境：Postman / curl 等无 Origin 的请求也放行
    if (!origin) return callback(null, true)
    const allowed = allowedOrigins.includes(origin)

    // #region agent log
    fetch('http://127.0.0.1:7354/ingest/f8e362e3-15ae-4816-b5e9-10f749463924', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'bd63c5',
      },
      body: JSON.stringify({
        sessionId: 'bd63c5',
        runId: 'cors-pre-fix',
        hypothesisId: 'H1',
        location: 'server/index.mjs:27',
        message: 'CORS origin check',
        data: { origin, allowed, allowedOrigins },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    if (allowed) return callback(null, true)
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
}))
app.use(express.json())

/**
 * 调用真实 LLM，将用户输入解析为 ParsedIntent
 * 这里为 DeepSeek 的 OpenAI 兼容接口
 */
async function callLLMIntentParser(input) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) {
    console.warn('[agent-server] DEEPSEEK_API_KEY 未配置，返回 unknown 意图')
    return {
      type: 'unknown',
      entities: {},
      confidence: 0,
    }
  }

  const systemPrompt = `
你是 CRM 销售助手的“意图解析模块”，只负责把用户的中文问题转换为结构化 JSON。
不要执行任何数据库 / 网络操作，不要杜撰数据。
只允许输出下面这个 JSON 结构，不要有多余文字：
{
  "type": "client_holdings" | "product_holders" | "products_on_sale" |
           "client_list" | "product_list" | "dashboard_stats" |
           "global_search" | "client_detail" | "product_detail" |
           "chart_type_distribution" | "create_follow_up" |
           "summarize_risky_products" | "chitchat" | "unknown",
  "entities": {
    "clientName": string?,
    "productName": string?,
    "productCode": string?,
    "keyword": string?,
    "productType": string?,
    "status": string?,
    "followUpType": "phone" | "visit" | "wechat" | "email" | string?,
    "followUpContent": string?,
    "followUpTime": string?
  },
  "confidence": number
}

含义说明：
- client_holdings: 查询某个客户持有哪些产品（如“张三持有哪些基金”）
- product_holders: 查询某个产品被哪些客户持有（如“某某基金被谁买了”）
- products_on_sale: 在售/募集中产品（可以附带产品类型）
- client_list: 查询客户列表（可附带筛选条件）
- product_list: 查询产品列表（可附带筛选条件）
- dashboard_stats: 总览/仪表盘类问题（如“整体情况怎么样”“有多少客户”）
- global_search: 简单搜索（如“查一下华夏”“搜索张三”）
- client_detail / product_detail: 单个客户/产品详情
- chart_type_distribution: 用户要求“生成一个按产品类型分组的规模占比图表”这类问题
- create_follow_up: 用户要求新增某个客户的跟进记录（需解析客户名、跟进类型、时间、内容）
- summarize_risky_products: 用户要求“整理一下目前高风险产品有哪些”等总结类问题
- chitchat: 普通聊天问题（不需要执行具体业务操作）
- unknown: 无法识别时使用

请根据用户输入，从上述 type 中选择一个最合适的，填入 entities 和 confidence（0-1）。
`

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    response_format: { type: 'json_object' },
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
    console.error('[agent-server] LLM 调用失败:', resp.status, text)
    throw new Error(`LLM 请求失败：${resp.status}`)
  }

  const json = await resp.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('LLM 返回内容为空')
  }

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[agent-server] 无法解析 LLM JSON：', content)
    throw new Error('LLM 返回的不是合法 JSON')
  }

  return {
    type: parsed.type ?? 'unknown',
    entities: parsed.entities ?? {},
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
  }
}

/**
 * 普通聊天：作为 CRM 销售助手回答用户问题，不返回结构化意图
 */
async function callLLMChat(message) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置')
  }

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content:
          '你是一名基金销售 CRM 助手，语气专业友好。只能根据用户提供的信息给出建议，不要编造具体产品/客户的精确数据，可给出泛化示例和话术建议。',
      },
      { role: 'user', content: message },
    ],
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
    console.error('[agent-server] Chat 调用失败:', resp.status, text)
    throw new Error(`Chat 请求失败：${resp.status}`)
  }

  const json = await resp.json()
  return json?.choices?.[0]?.message?.content ?? ''
}

// POST /agent/parse-intent 供前端调用
app.post('/agent/parse-intent', async (req, res) => {
  const input = req.body?.input
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'input 字段不能为空' })
  }

  try {
    const intent = await callLLMIntentParser(input)
    return res.json(intent)
  } catch (err) {
    console.error('[agent-server] 解析意图失败：', err)
    return res.status(500).json({ error: '解析意图失败，请稍后重试' })
  }
})

// 普通聊天接口：/agent/chat
app.post('/agent/chat', async (req, res) => {
  const text = req.body?.message
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'message 字段不能为空' })
  }

  try {
    const reply = await callLLMChat(text)
    return res.json({ message: reply })
  } catch (err) {
    console.error('[agent-server] 聊天失败：', err)
    return res.status(500).json({ error: '聊天失败，请稍后重试' })
  }
})

app.listen(PORT, () => {
  console.log(`[agent-server] 已启动，端口 ${PORT}`)
})

