import { useState } from 'react'
import { Input, Button, Typography, Empty, Space, Spin } from 'antd'
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
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
}

export default function AgentWidget() {
  const [input, setInput] = useState('')
  const { messages, setMessages } = useAgentChatStore()
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <RobotOutlined style={{ fontSize: 18, color: '#1677ff' }} />
        <span style={{ fontWeight: 500 }}>智能助手</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {messages.length === 0 ? (
          <Empty description="发送一条消息开始对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '80%',
                      background: '#1677ff',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: 16,
                      fontSize: 13,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        background: '#fafafa',
                        padding: '6px 10px',
                        borderRadius: 16,
                        fontSize: 13,
                        marginBottom: 2,
                      }}
                    >
                      <Text>{normalizeAgentText(m.text)}</Text>
                    </div>
                    {m.chartData && (
                      <div
                        style={{
                          marginTop: 4,
                          borderRadius: 12,
                          border: '1px solid #f0f0f0',
                          padding: 8,
                        }}
                      >
                        <div style={{ height: 220 }}>
                          <TypeDistributionChart data={m.chartData} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </Space>
        )}
      </div>
      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#ffffff',
            borderRadius: 999,
            padding: '4px 6px 4px 12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入你的问题…"
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              flex: 1,
              border: 'none',
              boxShadow: 'none',
              resize: 'none',
              paddingInline: 0,
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isPending}
          />
        </div>
      </div>
      {isPending && (
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <Spin fullscreen={true} tip="正在思考…"/>
          </div>
        )}
    </div>
  )
}

