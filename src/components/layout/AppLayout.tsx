import { useState } from 'react'
import { Layout, Modal, FloatButton } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { RobotOutlined } from '@ant-design/icons'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useAppStore } from '@/stores/useAppStore'
import AgentWidget from '@/components/agent/AgentWidget'

const { Content } = Layout

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const [agentOpen, setAgentOpen] = useState(false)
  const location = useLocation()

  // 在智能助手主页面不显示悬浮窗，避免重复入口
  const showAgentFloat = location.pathname !== '/ai-agent'

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
        <Content
          style={{
            margin: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      {showAgentFloat && (
        <>
          <FloatButton
            icon={<RobotOutlined />}
            type="primary"
            shape="circle"
            style={{ right: 32, bottom: 32 }}
            onClick={() => setAgentOpen(true)}
          />
          <Modal
            open={agentOpen}
            onCancel={() => setAgentOpen(false)}
            footer={null}
            width={420}
            style={{ top: 24, right: 24, paddingBottom: 0 }}
            styles={{ body: { padding: 0, height: 600 } ,mask: { backgroundColor: 'rgba(0,0,0,0.25)' }}}
            closable
            mask
          >
            <AgentWidget />
          </Modal>
        </>
      )}
    </Layout>
  )
}
