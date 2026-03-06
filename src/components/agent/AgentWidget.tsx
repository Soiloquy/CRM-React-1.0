/**
 * Agent 悬浮窗聊天组件（紧凑布局）
 * 推荐问题垂直排布在顶部
 */

import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Space, Modal } from 'antd'
import { SendOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAgentChatStore } from '@/hooks/useAgentChatStore'
import AgentPieChart from '@/components/agent/AgentPieChart'
import type { AgentChatMessage } from '@/agent/types'

const { TextArea } = Input
const { Text } = Typography

function normalizeAgentText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          background: '#f0f0f0',
          padding: '10px 14px',
          borderRadius: 16,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <span className="agent-typing-dot" />
        <span className="agent-typing-dot" />
        <span className="agent-typing-dot" />
      </div>
    </div>
  )
}

export default function AgentWidget() {
  const [input, setInput] = useState('')
  const {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    refreshSuggestions,
  } = useAgentChatStore()
  const [activeChartMessage, setActiveChartMessage] = useState<AgentChatMessage | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.filter((m) => !m.isLoading).length > 0

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || isLoading) return
    if (!text) setInput('')
    sendMessage(q)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 对话区域 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {!hasMessages ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 200,
              gap: 16,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              发送一条消息开始对话
            </Text>

            {/* 推荐问题：垂直排布 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', padding: '0 8px' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="agent-suggestion-btn"
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  style={{ textAlign: 'left' }}
                >
                  {s}
                </button>
              ))}
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={refreshSuggestions}
                  style={{ color: '#8c8c8c', fontSize: 12 }}
                >
                  换一批
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {messages.map((m) => {
              if (m.isLoading) {
                return <TypingIndicator key={m.id} />
              }

              if (m.role === 'user') {
                return (
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
                )
              }

              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        background: '#fafafa',
                        padding: '6px 10px',
                        borderRadius: 16,
                        fontSize: 13,
                        marginBottom: 2,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
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
            <div ref={chatEndRef} />
          </Space>
        )}
      </div>

      {/* 输入框 */}
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
            onClick={() => handleSend()}
            loading={isLoading}
          />
        </div>
      </div>

      {/* 图表预览弹窗 */}
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
            <AgentPieChart data={activeChartMessage.chartData} title={activeChartMessage.chartTitle} />
          </div>
        )}
      </Modal>
    </div>
  )
}
