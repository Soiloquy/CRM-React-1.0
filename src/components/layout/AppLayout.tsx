import { useState } from 'react'
import { Layout, FloatButton } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { RobotOutlined, CloseOutlined } from '@ant-design/icons'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useAppStore } from '@/stores/useAppStore'
import AgentWidget from '@/components/agent/AgentWidget'

const { Content } = Layout

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const [agentOpen, setAgentOpen] = useState(false)
  const location = useLocation()

  const isAgentPage = location.pathname === '/ai-agent'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 220,
          transition: 'margin-left 0.2s',
        }}
      >
        <HeaderBar />
        <Content style={{ margin: 24, minHeight: 280 }}>
          {/* ai-agent 路由由 KeepAlive 包裹，切换页面时组件不销毁 */}
          <Outlet />
        </Content>
      </Layout>

      {/* 悬浮按钮：不在 ai-agent 页面且悬浮窗未打开时显示 */}
      {!isAgentPage && !agentOpen && (
        <FloatButton
          icon={<RobotOutlined />}
          type="primary"
          shape="circle"
          style={{ right: 32, bottom: 32 }}
          onClick={() => setAgentOpen(true)}
        />
      )}

      {/* 遮罩层：点击关闭悬浮窗 */}
      {!isAgentPage && (
        <div
          className={`agent-float-mask ${agentOpen ? 'agent-float-visible' : 'agent-float-hidden'}`}
          onClick={() => setAgentOpen(false)}
        />
      )}

      {/* 悬浮窗：用 fixed div + CSS 动画替代 Modal，关闭时不销毁组件 */}
      {!isAgentPage && (
        <div
          className={`agent-float-panel ${agentOpen ? 'agent-float-visible' : 'agent-float-hidden'}`}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ fontSize: 18, color: '#1677ff' }} />
              <span style={{ fontWeight: 500 }}>智能助手</span>
            </div>
            <CloseOutlined
              style={{ fontSize: 14, color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => setAgentOpen(false)}
            />
          </div>
          <AgentWidget />
        </div>
      )}
    </Layout>
  )
}
