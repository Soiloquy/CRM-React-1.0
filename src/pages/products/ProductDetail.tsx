import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  Button,
  Table,
  Row,
  Col,
  Result,
  Space,
  Divider,
} from 'antd'
import { ArrowLeftOutlined, WarningOutlined } from '@ant-design/icons'
import { useProductDetail, useProductHolders } from '@/hooks/useProducts'
import {
  PRODUCT_TYPE_MAP,
  PRODUCT_STATUS_MAP,
  PRODUCT_STATUS_COLOR,
} from '@/types/product'
import { formatCurrency, formatPercent, formatNav, formatDate } from '@/utils/format'
import type { Holding } from '@/types/holding'
import type { ColumnsType } from 'antd/es/table'
import NavChart from '@/components/products/NavChart'
import RiskDistributionBar from '@/components/products/RiskDistributionBar'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProductDetail(id!)
  const { data: holders, isLoading: holdersLoading } = useProductHolders(id!)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <Result
        status="404"
        title="产品未找到"
        subTitle="该产品不存在或已被删除"
        extra={
          <Button type="primary" onClick={() => navigate('/products')}>
            返回产品列表
          </Button>
        }
      />
    )
  }

  const riskLevelMap: Record<string, { label: string; color: string }> = {
    conservative: { label: '保守', color: 'green' },
    stable: { label: '稳健', color: 'blue' },
    balanced: { label: '平衡', color: 'gold' },
    aggressive: { label: '积极', color: 'orange' },
    radical: { label: '激进', color: 'red' },
  }
  const riskInfo = riskLevelMap[product.riskLevel] || {
    label: product.riskLevel,
    color: 'default',
  }

  const holderColumns: ColumnsType<Holding> = [
    {
      title: '客户名称',
      dataIndex: 'clientName',
      render: (name: string, record: Holding) => (
        <Link to={`/clients/${record.clientId}`}>{name}</Link>
      ),
    },
    {
      title: '持有份额',
      dataIndex: 'shares',
      align: 'right',
      render: (val: number) => val.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
    },
    {
      title: '持有金额',
      dataIndex: 'amount',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '买入日期',
      dataIndex: 'buyDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: '收益率',
      dataIndex: 'returnRate',
      align: 'right',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#cf1322' : '#3f8600' }}>
          {formatPercent(val)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        >
          返回列表
        </Button>
      </Space>

      <Card title="基本信息" style={{ marginBottom: 16, borderRadius: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
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
          <Descriptions.Item label="风险等级">
            <Tag color={riskInfo.color}>{riskInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="基金经理">{product.manager}</Descriptions.Item>
          <Descriptions.Item label="最新净值">
            <span style={{ fontWeight: 600, fontSize: 16 }}>{formatNav(product.nav)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="累计净值">{formatNav(product.cumulativeNav)}</Descriptions.Item>
          <Descriptions.Item label="日涨幅">
            <span
              style={{
                color: product.dailyReturn >= 0 ? '#cf1322' : '#3f8600',
                fontWeight: 500,
              }}
            >
              {formatPercent(product.dailyReturn)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="基金规模">{formatCurrency(product.scale)}</Descriptions.Item>
          <Descriptions.Item label="管理公司">{product.managementCompany}</Descriptions.Item>
          <Descriptions.Item label="托管人">{product.custodian}</Descriptions.Item>
          <Descriptions.Item label="成立日期">{formatDate(product.establishDate)}</Descriptions.Item>
          <Descriptions.Item label="公司 AUM 占比">
            <Space>
              <span style={{ fontWeight: 500 }}>{product.totalAumPercent.toFixed(2)}%</span>
              {product.totalAumPercent > 30 && (
                <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 11 }}>
                  集中度偏高
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="产品简介" span={2}>{product.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Client Holding Overview */}
      <Card title="客户持有概览" style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={32} style={{ marginBottom: 20 }}>
          <Col>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>持有人数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#141414' }}>
              {product.holderCount}
            </div>
          </Col>
          <Col>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>持有总金额</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#141414' }}>
              {formatCurrency(product.totalHoldingAmount)}
            </div>
          </Col>
        </Row>
        <Divider style={{ margin: '0 0 16px' }} />
        <div style={{ marginBottom: 4, fontSize: 13, color: '#8c8c8c' }}>风险等级分布</div>
        <div style={{ maxWidth: 500 }}>
          <RiskDistributionBar
            low={product.riskDistribution.low}
            medium={product.riskDistribution.medium}
            high={product.riskDistribution.high}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="净值走势" style={{ borderRadius: 12 }}>
            <div className="chart-container">
              <NavChart data={product.navHistory} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="持有人列表" style={{ marginTop: 16, borderRadius: 12 }}>
        <Table
          rowKey="id"
          columns={holderColumns}
          dataSource={holders}
          loading={holdersLoading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 位持有人` }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  )
}
