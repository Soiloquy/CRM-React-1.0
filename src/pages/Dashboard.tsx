import { Row, Col, Card, Spin, Empty } from 'antd'
import {
  FundOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserAddOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import {
  useDashboardStats,
  useTypeDistribution,
  useRiskTypeAnalysis,
  useNewClientTrend,
  useRecentFollowUps,
} from '@/hooks/useDashboard'
import { formatCurrency } from '@/utils/format'
import TypeDistributionChart from '@/components/dashboard/TypeDistributionChart'
import RiskTypeAnalysisChart from '@/components/dashboard/RiskTypeAnalysisChart'
import NewClientTrendChart from '@/components/dashboard/NewClientTrendChart'
import RecentFollowUps from '@/components/dashboard/RecentFollowUps'

interface StatCardProps {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string | number
  desc?: string
}

function StatCard({ icon, iconColor, label, value, desc }: StatCardProps) {
  return (
    <Card className="stat-card" styles={{ body: { padding: '20px 24px' } }} style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="stat-label">{label}</span>
        <span style={{ fontSize: 18, color: iconColor, opacity: 0.7 }}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </Card>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: distribution, isLoading: distLoading } = useTypeDistribution()
  const { data: riskTypeData, isLoading: riskLoading } = useRiskTypeAnalysis()
  const { data: clientTrend, isLoading: trendLoading } = useNewClientTrend()
  const { data: followUps, isLoading: followUpsLoading } = useRecentFollowUps()

  return (
    <div>
      {/* <div className="page-header">
        <h2>数据概览</h2>
        <p>了解整体业务数据和最新动态</p>
      </div> */}

      {/* Row 1: 5 KPI Cards */}
      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={4} xl={4}>
            <StatCard
              icon={<FundOutlined />}
              iconColor="#1677ff"
              label="总产品数"
              value={stats?.totalProducts ?? '-'}
              desc="新增产品数+3"
            />
          </Col>
          <Col xs={24} sm={12} lg={5} xl={5}>
            <StatCard
              icon={<ShoppingOutlined />}
              iconColor="#52c41a"
              label="在售产品数"
              value={stats?.activeProducts ?? '-'}
              desc="当前募集中"
            />
          </Col>
          <Col xs={24} sm={12} lg={5} xl={5}>
            <StatCard
              icon={<TeamOutlined />}
              iconColor="#13c2c2"
              label="客户总数"
              value={stats?.totalClients ?? '-'}
              desc="累计客户+10%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5} xl={5}>
            <StatCard
              icon={<UserAddOutlined />}
              iconColor="#722ed1"
              label="本月新增客户"
              value={stats?.newClientsThisMonth ?? '-'}
              desc="较上月新增客户-25%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5} xl={5}>
            <StatCard
              icon={<DollarOutlined />}
              iconColor="#fa8c16"
              label="本月新增认购"
              value={stats ? formatCurrency(stats.newSubscriptionAmount) : '-'}
              desc="较上月新增金额+18%"
            />
          </Col>
        </Row>
      </Spin>

      {/* Row 2: Structural Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title="产品规模占比"
            loading={distLoading}
            styles={{ body: { padding: '12px 16px 0' } }}
          >
            {distribution && distribution.length > 0 ? (
              <TypeDistributionChart data={distribution} />
            ) : (
              <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无数据" />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title="客户风险 x 产品类型"
            loading={riskLoading}
            styles={{ body: { padding: '12px 16px 0' } }}
          >
            {riskTypeData && riskTypeData.length > 0 ? (
              <RiskTypeAnalysisChart data={riskTypeData} />
            ) : (
              <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无数据" />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Client Trend + Recent Follow-ups */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="近 6 个月新增客户趋势"
            loading={trendLoading}
            styles={{ body: { padding: '12px 16px 0' } }}
            style={{ height: '100%' }}
          >
            {clientTrend && clientTrend.length > 0 ? (
              <NewClientTrendChart data={clientTrend} />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无数据" />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="最近跟进记录"
            styles={{ body: { padding: '0 16px' } }}
            style={{ height: '100%' }}
          >
            {followUps && followUps.length > 0 ? (
              <RecentFollowUps data={followUps} loading={followUpsLoading} />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无跟进记录" />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
