import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/utils/useDebounce'
import { Table, Card, Input, Select, Tag, Button, Row, Col, Empty } from 'antd'
import {
  SearchOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { useProducts } from '@/hooks/useProducts'
import { useFilterStore } from '@/stores/useFilterStore'
import { formatCurrency, formatPercent, formatNav } from '@/utils/format'
import {
  PRODUCT_TYPE_MAP,
  PRODUCT_STATUS_MAP,
  PRODUCT_STATUS_COLOR,
  RISK_LEVEL_MAP,
  RISK_LEVEL_COLOR,
  type ProductType,
  type ProductStatus,
  type RiskLevel,
} from '@/types/product'
import type { ProductWithHolderCount } from '@/services/productService'
import type { ColumnsType } from 'antd/es/table'
import { PAGE_SIZE } from '@/utils/constants'
import ProductDetailDrawer from '@/components/products/ProductDetailDrawer'

const SORT_OPTIONS = [
  { value: '', label: '默认排序' },
  { value: 'scale_desc', label: '规模从高到低' },
  { value: 'scale_asc', label: '规模从低到高' },
  { value: 'nav_desc', label: '净值从高到低' },
  { value: 'nav_asc', label: '净值从低到高' },
  { value: 'establishDate_desc', label: '成立日期最新' },
  { value: 'establishDate_asc', label: '成立日期最早' },
]

export default function ProductList() {
  const [page, setPage] = useState(1)
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const {
    productFilters,
    setProductFilter,
    resetProductFilters,
    hasActiveProductFilters,
  } = useFilterStore()

  const sortKey = productFilters.sortBy
    ? `${productFilters.sortBy}_${productFilters.sortOrder}`
    : ''

  const debouncedKeyword = useDebounce(productFilters.keyword, 300)

  const { data, isLoading } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    type: productFilters.type || undefined,
    status: productFilters.status || undefined,
    keyword: debouncedKeyword || undefined,
    sortBy: productFilters.sortBy || undefined,
    sortOrder: productFilters.sortOrder,
  })

  const lastUpdated = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }, [data])

  const handleSortChange = (value: string) => {
    if (!value) {
      setProductFilter({ sortBy: '', sortOrder: 'desc' })
    } else {
      const parts = value.split('_')
      const order = parts.pop() as 'asc' | 'desc'
      const field = parts.join('_')
      setProductFilter({ sortBy: field, sortOrder: order })
    }
    setPage(1)
  }

  const handleViewDetail = (id: string) => {
    setDrawerProductId(id)
    setDrawerOpen(true)
  }


  const columns: ColumnsType<ProductWithHolderCount> = [
    {
      title: '产品名称',
      dataIndex: 'name',
      width: 160,
      ellipsis: true,
      render: (name: string, record) => (
        <div>
          <Link
            to={`/products/${record.id}`}
            style={{ fontWeight: 500 }}
          >
            {name}
          </Link>
          {record.status === 'raising' && (
            <Tag
              icon={<FireOutlined />}
              color="blue"
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              热募
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '产品代码',
      dataIndex: 'code',
      width: 100,
    },
    {
      title: '产品类型',
      dataIndex: 'type',
      width: 90,
      render: (type: ProductType) => (
        <Tag style={{ borderRadius: 4 }}>{PRODUCT_TYPE_MAP[type]}</Tag>
      ),
    },
    {
      title: '最新净值',
      dataIndex: 'nav',
      width: 100,
      align: 'right',
      render: (nav: number, record) => (
        <div>
          <span style={{ fontWeight: 500 }}>{formatNav(nav)}</span>
          <div
            style={{
              fontSize: 12,
              color: record.dailyReturn >= 0 ? '#cf1322' : '#3f8600',
            }}
          >
            {formatPercent(record.dailyReturn)}
          </div>
        </div>
      ),
    },
    {
      title: '基金规模',
      dataIndex: 'scale',
      width: 120,
      align: 'right',
      render: (scale: number) => (
        <span style={{ fontWeight: 500 }}>{formatCurrency(scale)}</span>
      ),
    },
    {
      title: '持有客户数',
      dataIndex: 'holderCount',
      width: 100,
      align: 'center',
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: count > 0 ? '#1677ff' : '#8c8c8c' }}>
          {count}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: ProductStatus) => (
        <Tag
          color={PRODUCT_STATUS_COLOR[status]}
          style={{ borderRadius: 4 }}
        >
          {PRODUCT_STATUS_MAP[status]}
        </Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 90,
      render: (level: RiskLevel) => (
        <Tag color={RISK_LEVEL_COLOR[level]} style={{ borderRadius: 4 }}>
          {RISK_LEVEL_MAP[level]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: ProductWithHolderCount) => (
        <Button
          type="link"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetail(record.id)
          }}
        >
          查看详情
        </Button>
      ),
    },
  ]

  const showFiltersActive = hasActiveProductFilters()

  return (
    <div>
      {/* <div className="page-header">
        <h2>产品货架</h2>
        <p>浏览和管理公司在售基金产品，点击产品查看详细信息</p>
      </div> */}

      {/* Filter & Sort Area */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="搜索产品名称 / 代码 / 经理"
              allowClear
              value={productFilters.keyword}
              onChange={(e) => {
                setProductFilter({ keyword: e.target.value })
                setPage(1)
              }}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="产品类型"
              allowClear
              value={productFilters.type || undefined}
              onChange={(val) => {
                setProductFilter({ type: val || '' })
                setPage(1)
              }}
              options={Object.entries(PRODUCT_TYPE_MAP).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="产品状态"
              allowClear
              value={productFilters.status || undefined}
              onChange={(val) => {
                setProductFilter({ status: val || '' })
                setPage(1)
              }}
              options={Object.entries(PRODUCT_STATUS_MAP).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={sortKey || undefined}
              placeholder="排序方式"
              allowClear
              onChange={handleSortChange}
              options={SORT_OPTIONS}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            {showFiltersActive && (
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  resetProductFilters()
                  setPage(1)
                }}
                type="text"
                style={{ color: '#1677ff' }}
              >
                清除筛选
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <Card
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              产品列表
              {data && (
                <span style={{ fontWeight: 400, fontSize: 13, color: '#8c8c8c', marginLeft: 8 }}>
                  共 {data.total} 条
                </span>
              )}
            </span>
            <span style={{ fontSize: 12, color: '#bfbfbf', fontWeight: 400 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              更新于 {lastUpdated}
            </span>
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.total || 0,
            showSizeChanger: false,
            onChange: setPage,
            style: { padding: '0 16px' },
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                description="没有匹配的产品"
                style={{ padding: '40px 0' }}
              >
                {showFiltersActive && (
                  <Button
                    type="primary"
                    onClick={() => {
                      resetProductFilters()
                      setPage(1)
                    }}
                  >
                    重置筛选条件
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>

      <ProductDetailDrawer
        productId={drawerProductId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        afterOpenChange={(visible: boolean) => {
          if (!visible) setDrawerProductId(null)
        }}
      />
    </div>
  )
}
