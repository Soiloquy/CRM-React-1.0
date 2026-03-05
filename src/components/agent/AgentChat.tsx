/**
 * Agent 对话 UI：自然语言聊天 + 业务能力（图表 / 跟进 / 整理信息）
 */

import { useState } from 'react'
import { Card, Input, Button, Spin, Typography, Empty, Space, Modal } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'
import { useAgent, type AgentExecutionResult } from '@/hooks/useAgent'
import TypeDistributionChart from '@/components/dashboard/TypeDistributionChart'
import { useAgentChatStore, type AgentChatMessage } from '@/hooks/useAgentChatStore'

const { TextArea } = Input
const { Text } = Typography

function createAssistantMessage(result: AgentExecutionResult): AgentChatMessage {
  const base: AgentChatMessage = {
    id: String(Date.now()),
    role: 'assistant',
    text: result.message,
  }

  const toolName = result.result?.toolName
  const data = result.result?.data as any

  if (toolName === 'chart_type_distribution' && data?.distribution) {
    return {
      ...base,
      chartData: data.distribution,
      chartTitle: '按产品类型分组的规模占比',
    }
  }

  return base
}

function normalizeAgentText(text: string): string {
  return text
    // 去掉 **加粗** 语法
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // 去掉行内代码反引号
    .replace(/`([^`]+)`/g, '$1')
    // 简单处理标题井号
    .replace(/^#+\s*/gm, '')
}

export default function AgentChat() {
  const [input, setInput] = useState('')
  const { messages, setMessages } = useAgentChatStore()
  const [activeChartMessage, setActiveChartMessage] = useState<AgentChatMessage | null>(null)
  const { mutateAsync: run, isPending } = useAgent()

  const handleSend = async () => {
    const q = input.trim()
    if (!q) return
    setInput('')

    const userMsg: AgentChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: q,
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await run(q)
      const assistantMsg = createAssistantMessage(res as AgentExecutionResult)
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      const errorMsg: AgentChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        text: '抱歉，服务暂时不可用，请稍后再试。',
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  return (
    <div
      style={{
        height: '100%',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '32px 16px',
        background: '#f5f5f5',
      }}
    >
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>智能助手</div>
          <Text type="secondary">
            Ready when you are. 输入任何问题或销售场景，让助手帮你思考、查询和生成可视化。
          </Text>
        </div>

        <Card
          size="small"
          style={{ borderRadius: 16, minHeight: 200, background: '#ffffff' }}
          styles={{ body: { padding: 16 } }}
        >
        {messages.length === 0 ? (
          <Empty description="发送一条消息开始对话" />
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div
                    key={m.id}
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        background: '#1677ff',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: 16,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={m.id}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        background: '#fafafa',
                        padding: '8px 12px',
                        borderRadius: 16,
                        marginBottom: 4,
                      }}
                    >
                      <Text>{normalizeAgentText(m.text)}</Text>
                    </div>
                    {m.chartData && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setActiveChartMessage(m)}
                        style={{ paddingLeft: 0 }}
                      >
                        预览图表
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </Space>
        )}
        </Card>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            height:48,
          }}
        >
          <RobotOutlined style={{ fontSize: 20, color: '#1677ff', marginLeft: 16 }} />
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask anything"
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              display:'inline-block',
              flex: 1,
              border: 'none',
              boxShadow: 'none',
              resize: 'none',
              textOverflow:'ellipsis',
              whiteSpace:'nowrap',
              overflow:'hidden',
            }}
          />
          <Button
            type="primary"
            shape="circle"
            style={{marginRight:16}}
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isPending}
          />
        </div>

        {isPending && (
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <Spin fullscreen={true} tip="正在思考…"/>
          </div>
        )}
      </div>

      <Modal
        open={!!activeChartMessage?.chartData}
        title={activeChartMessage?.chartTitle ?? '图表预览'}
        centered
        footer={null}
        onCancel={() => setActiveChartMessage(null)}
        width={720}
      >
        {activeChartMessage?.chartData && (
          <div style={{ height: 360 }}>
            <TypeDistributionChart data={activeChartMessage.chartData} />
          </div>
        )}
      </Modal>
    </div>
  )
}
