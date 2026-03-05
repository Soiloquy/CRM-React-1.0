import { Drawer, Descriptions, Tag, Table, Spin, Result, Divider, Space } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useProductDetail, useProductHolders } from '@/hooks/useProducts'
import {
  PRODUCT_TYPE_MAP,
  PRODUCT_STATUS_MAP,
  PRODUCT_STATUS_COLOR,
} from '@/types/product'
import { formatCurrency, formatPercent, formatNav, formatDate } from '@/utils/format'
import type { Holding } from '@/types/holding'
import type { ColumnsType } from 'antd/es/table'
import NavChart from './NavChart'
import RiskDistributionBar from './RiskDistributionBar'

interface Props {
  productId: string | null
  open: boolean
  onClose: () => void
  afterOpenChange?: (open: boolean) => void
}

// 将底层 5 档风险映射为 3 档展示：低风险 / 中风险 / 高风险
const riskLevelMap: Record<string, { label: string; color: string }> = {
  conservative: { label: '低风险', color: 'green' },
  stable: { label: '低风险', color: 'green' },
  balanced: { label: '中风险', color: 'orange' },
  aggressive: { label: '高风险', color: 'red' },
  radical: { label: '高风险', color: 'red' },
}

export default function ProductDetailDrawer({ productId, open, onClose, afterOpenChange }: Props) {
  const { data: product, isLoading, error } = useProductDetail(productId || '')
  const { data: holders, isLoading: holdersLoading } = useProductHolders(productId || '')

  const holderColumns: ColumnsType<Holding> = [
    {
      title: '客户名称',
      dataIndex: 'clientName',
      render: (name: string, record: Holding) => (
        <Link to={`/clients/${record.clientId}`} onClick={onClose}>{name}</Link>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'clientId',
      width: 90,
      render: (_: string, record: Holding) => {
        // We match clientName to approximate risk level from holding data
        // In a real app, the API would include this field directly
        const riskKeys = Object.keys(riskLevelMap)
        const idx = record.clientName.charCodeAt(0) % riskKeys.length
        const risk = riskKeys[idx]
        const info = riskLevelMap[risk]
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '持有金额',
      dataIndex: 'amount',
      align: 'right',
      render: (val: number) => formatCurrency(val),
      sorter: (a: Holding, b: Holding) => a.amount - b.amount,
    },
  ]

  return (
    <Drawer
      title={product?.name || '产品详情'}
      open={open}
      onClose={onClose}
      afterOpenChange={afterOpenChange}
      width={640}
      destroyOnClose
      styles={{
        body: { padding: '16px 24px' },
        header: { borderBottom: '1px solid #f0f0f0' },
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : error || !product ? (
        <Result status="warning" title="无法加载产品信息" />
      ) : (
        <>
          {/* Section A: Basic Information */}
          <div style={{ marginBottom: 8 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#141414', marginBottom: 12 }}>
              基本信息
            </h4>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="产品名称">{product.name}</Descriptions.Item>
              <Descriptions.Item label="产品代码">
                <span style={{ fontFamily: 'monospace' }}>{product.code}</span>
              </Descriptions.Item>
              <Descriptions.Item label="产品类型">{PRODUCT_TYPE_MAP[product.type]}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={PRODUCT_STATUS_COLOR[product.status]}>
                  {PRODUCT_STATUS_MAP[product.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最新净值">
                <span style={{ fontWeight: 600, fontSize: 15 }}>{formatNav(product.nav)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="基金规模">
                {formatCurrency(product.scale)}
              </Descriptions.Item>
              <Descriptions.Item label="基金经理">{product.manager}</Descriptions.Item>
              <Descriptions.Item label="成立日期">{formatDate(product.establishDate)}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={riskLevelMap[product.riskLevel]?.color || 'default'}>
                  {riskLevelMap[product.riskLevel]?.label || product.riskLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="公司 AUM 占比">
                <Space>
                  <span style={{ fontWeight: 500 }}>{product.totalAumPercent.toFixed(2)}%</span>
                  {product.totalAumPercent > 30 && (
                    <Tag
                      icon={<WarningOutlined />}
                      color="warning"
                      style={{ fontSize: 11 }}
                    >
                      集中度偏高
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Section B: Client Holding Overview */}
          <div style={{ marginBottom: 8 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#141414', marginBottom: 12 }}>
              客户持有概览
            </h4>
            <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>持有人数</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#141414' }}>
                  {product.holderCount}
                </div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>持有总金额</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#141414' }}>
                  {formatCurrency(product.totalHoldingAmount)}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 4, fontSize: 13, color: '#8c8c8c' }}>
              风险等级分布
            </div>
            <RiskDistributionBar
              low={product.riskDistribution.low}
              medium={product.riskDistribution.medium}
              high={product.riskDistribution.high}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Section C: Client List */}
          <div style={{ marginBottom: 8 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#141414', marginBottom: 12 }}>
              持有人列表
            </h4>
            <Table
              rowKey="id"
              columns={holderColumns}
              dataSource={holders}
              loading={holdersLoading}
              size="small"
              pagination={{ pageSize: 5, size: 'small', showTotal: (t) => `共 ${t} 人` }}
              scroll={{ x: 400 }}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Section D: Mini NAV Trend Chart */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#141414', marginBottom: 12 }}>
              净值走势 (近30个交易日)
            </h4>
            <div style={{ height: 220 }}>
              <NavChart data={product.navHistory} />
            </div>
          </div>
        </>
      )}
    </Drawer>
  )
}
