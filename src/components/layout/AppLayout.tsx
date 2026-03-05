import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import HeaderBar from './HeaderBar'
import { useAppStore } from '@/stores/useAppStore'

const { Content } = Layout

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)

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
    </Layout>
  )
}
