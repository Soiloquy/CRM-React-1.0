import { Layout, Menu } from 'antd'
import {
  BarChartOutlined,
  ShopOutlined,
  TeamOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'

const { Sider } = Layout

const menuItems = [
  { key: '/dashboard', icon: <BarChartOutlined />, label: '数据概览' },
  { key: '/products', icon: <ShopOutlined />, label: '产品货架' },
  { key: '/clients', icon: <TeamOutlined />, label: '客户管理' },
  { key: '/ai-agent', icon: <RobotOutlined />, label: '智能助手' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={toggleSidebar}
      width={220}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
      theme="light"
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
          overflow: 'hidden',
        }}
      >
        {collapsed ? (
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>
            FM
          </span>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1677ff', whiteSpace: 'nowrap' }}>
            FundMaster CRM
          </span>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  )
}
