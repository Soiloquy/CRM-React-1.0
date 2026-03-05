import { Layout, Input, Avatar, Dropdown, Space, Typography, AutoComplete } from 'antd'
import {
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useGlobalSearch } from '@/hooks/useDashboard'
import { useDebounce } from '@/utils/useDebounce'

const { Header } = Layout
const { Text } = Typography

const PAGE_TITLE_MAP: Record<string, string> = {
  '/dashboard': '数据概览',
  '/products': '产品货架',
  '/clients': '客户管理',
  '/ai-agent': '智能助手',
}

export default function HeaderBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const [searchKeyword, setSearchKeyword] = useState('')

  const basePath = '/' + location.pathname.split('/')[1]
  const pageTitle = PAGE_TITLE_MAP[basePath] || '详情'

  const debouncedKeyword = useDebounce(searchKeyword, 300)
  const { data: searchResults } = useGlobalSearch(debouncedKeyword)


  const searchOptions = useMemo(() => {
    if (!searchResults) return []
    const options: Array<{ label: React.ReactNode; value: string }> = []

    if (searchResults.products?.length) {
      options.push({
        label: (
          <Text type="secondary" style={{ fontSize: 12 }}>
            产品
          </Text>
        ),
        value: 'product-header',
      })
      searchResults.products.forEach((p) => {
        options.push({
          label: (
            <Space>
              <ShopOutlined />
              <span>{p.name}</span>
              <Text type="secondary">{p.code}</Text>
            </Space>
          ),
          value: `product:${p.id}`,
        })
      })
    }

    if (searchResults.clients?.length) {
      options.push({
        label: (
          <Text type="secondary" style={{ fontSize: 12 }}>
            客户
          </Text>
        ),
        value: 'client-header',
      })
      searchResults.clients.forEach((c) => {
        options.push({
          label: (
            <Space>
              <TeamOutlined />
              <span>{c.name}</span>
              <Text type="secondary">{c.phone}</Text>
            </Space>
          ),
          value: `client:${c.id}`,
        })
      })
    }

    return options
  }, [searchResults])

  const handleSelect = (val: string) => {
    if (val.startsWith('product:')) {
      navigate(`/products/${val.replace('product:', '')}`)
    } else if (val.startsWith('client:')) {
      navigate(`/clients/${val.replace('client:', '')}`)
    }
    setSearchKeyword('')
  }

  const userMenuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ]

  return (
    <Header
      style={{
        padding: '0 24px',
        height: 56,
        lineHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Text strong style={{ fontSize: 16 }}>
        {pageTitle}
      </Text>

      <Space size={16}>
        <AutoComplete
          options={searchOptions}
          onSelect={handleSelect}
          onSearch={setSearchKeyword}
          value={searchKeyword}
          style={{ width: 280 }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="搜索产品 / 客户..."
            allowClear
          />
        </AutoComplete>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size={32} icon={<UserOutlined />} />
            <span style={{ fontSize: 14 }}>{currentUser.name}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
