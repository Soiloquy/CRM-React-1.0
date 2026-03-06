/**
 * Agent 对话主页面 UI
 * 推荐问题 + 骨架加载 + 图表预览
 */

import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Space, Modal } from 'antd'
import { SendOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAgentChatStore } from '@/hooks/useAgentChatStore'
import AgentPieChart from '@/components/agent/AgentPieChart'
import type { AgentChatMessage } from '@/agent/types'

const { TextArea } = Input
const { Text } = Typography

function normalizeAgentText(text: string): string {
  return text
    // 去掉 **加粗** 语法
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // 去掉行内代码反引号
    .replace(/`([^`]+)`/g, '$1')
    // 简单处理标题井号
    .replace(/^#+\s*/gm, '')
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          background: '#f5f5f5',
          padding: '12px 16px',
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

export default function AgentChat() {
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
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            智能助手
          </div>
          <Text type="secondary">
            输入任何问题或销售场景，让助手帮你思考、查询和生成可视化。
          </Text>
        </div>

        {/* 对话区域 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            minHeight: 200,
            maxHeight: 'calc(100vh - 340px)',
            overflowY: 'auto',
            padding: 16,
            marginBottom: 16,
          }}
        >
          {!hasMessages ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
                color: '#8c8c8c',
              }}
            >
              <RobotOutlined style={{ fontSize: 40, marginBottom: 12, color: '#bfbfbf' }} />
              <Text type="secondary">发送一条消息开始对话</Text>
            </div>
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
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
                          padding: '8px 14px',
                          borderRadius: 16,
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
                          padding: '8px 14px',
                          borderRadius: 16,
                          marginBottom: 4,
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
            background: '#ffffff',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 48,
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
              display: 'inline-block',
              flex: 1,
              border: 'none',
              boxShadow: 'none',
              resize: 'none',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          />
          <Button
            type="primary"
            shape="circle"
            style={{ marginRight: 16 }}
            icon={<SendOutlined />}
            onClick={() => handleSend()}
            loading={isLoading}
          />
        </div>

        {/* 推荐问题（仅在没有消息时显示） */}
        {!hasMessages && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="agent-suggestion-btn"
                onClick={() => handleSend(s)}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
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
        )}
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
