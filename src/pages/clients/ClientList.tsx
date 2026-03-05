import { useState } from 'react'
import { useDebounce } from '@/utils/useDebounce'
import { Table, Card, Input, Select, Button, Tag, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import { useFilterStore } from '@/stores/useFilterStore'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  CLIENT_LEVEL_MAP,
  CLIENT_LEVEL_COLOR,
  CLIENT_RISK_LEVEL_MAP,
  type Client,
  type ClientLevel,
  type ClientRiskLevel,
} from '@/types/client'
import type { ColumnsType } from 'antd/es/table'
import { PAGE_SIZE } from '@/utils/constants'

export default function ClientList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { clientFilters, setClientFilter, resetClientFilters } =
    useFilterStore()

  const debouncedKeyword = useDebounce(clientFilters.keyword, 300)

  const { data, isLoading } = useClients({
    page,
    pageSize: PAGE_SIZE,
    level: clientFilters.level || undefined,
    riskLevel: clientFilters.riskLevel || undefined,
    keyword: debouncedKeyword || undefined,
  })

  const columns: ColumnsType<Client> = [
    {
      title: '客户姓名',
      dataIndex: 'name',
      width: 120,
      render: (name: string, record: Client) => (
        <a onClick={() => navigate(`/clients/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      width: 100,
      render: (level: ClientLevel) => (
        <Tag color={CLIENT_LEVEL_COLOR[level]}>
          {CLIENT_LEVEL_MAP[level]}
        </Tag>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
    },
    {
      title: '风险偏好',
      dataIndex: 'riskLevel',
      width: 100,
      render: (level: ClientRiskLevel) => CLIENT_RISK_LEVEL_MAP[level],
    },
    {
      title: '总资产',
      dataIndex: 'totalAssets',
      width: 130,
      align: 'right',
      render: (val: number) => formatCurrency(val),
      sorter: (a: Client, b: Client) => a.totalAssets - b.totalAssets,
    },
    {
      title: '最近跟进',
      dataIndex: 'lastFollowUp',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
  ]

  return (
    <div>
      {/* <div className="page-header">
        <h2>客户管理</h2>
        <p>管理客户信息、跟踪客户关系</p>
      </div> */}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索姓名/电话/邮箱..."
              allowClear
              value={clientFilters.keyword}
              onChange={(e) => {
                setClientFilter({ keyword: e.target.value })
                setPage(1)
              }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="客户等级"
              allowClear
              value={clientFilters.level || undefined}
              onChange={(val) => {
                setClientFilter({ level: val || '' })
                setPage(1)
              }}
              options={Object.entries(CLIENT_LEVEL_MAP).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="风险偏好"
              allowClear
              value={clientFilters.riskLevel || undefined}
              onChange={(val) => {
                setClientFilter({ riskLevel: val || '' })
                setPage(1)
              }}
              options={Object.entries(CLIENT_RISK_LEVEL_MAP).map(
                ([key, label]) => ({ value: key, label })
              )}
            />
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                resetClientFilters()
                setPage(1)
              }}
            >
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.total || 0,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: false,
            onChange: setPage,
          }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => navigate(`/clients/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}
