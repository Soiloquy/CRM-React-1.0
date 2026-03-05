import { Card, Typography, Space } from 'antd'
import { RobotOutlined, BulbOutlined, SearchOutlined, MessageOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const features = [
  {
    icon: <SearchOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: '智能查询',
    desc: '用自然语言查询产品和客户信息，例如"张三持有哪些基金"或"在售的股票型基金有哪些"',
  },
  {
    icon: <MessageOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    title: '客户洞察',
    desc: '自动分析客户持仓和风险偏好，生成个性化的产品推荐和跟进建议',
  },
  {
    icon: <BulbOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
    title: '市场速递',
    desc: '汇总基金市场动态和公司产品表现，帮助销售团队快速了解最新信息',
  },
]

export default function AIAgent() {
  return (
    <div>
      {/* <div className="page-header">
        <h2>智能助手</h2>
        <p>AI 驱动的销售助手，提升工作效率</p>
      </div> */}

      <Card
        style={{
          textAlign: 'center',
          maxWidth: 700,
          margin: '0 auto',
          marginBottom: 32,
          padding: '32px 0',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#e6f4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <RobotOutlined style={{ fontSize: 40, color: '#1677ff' }} />
        </div>
        <Title level={3} style={{ marginBottom: 8 }}>
          AI 智能助手即将上线
        </Title>
        <Paragraph
          style={{ color: '#595959', maxWidth: 440, margin: '0 auto' }}
        >
          我们正在为你打造一个强大的 AI 助手，它将帮助你更高效地管理客户关系和产品信息。
          敬请期待！
        </Paragraph>
      </Card>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          即将支持的功能
        </Title>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {features.map((f, i) => (
            <Card key={i} size="small">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    {f.title}
                  </Text>
                  <div style={{ color: '#595959', marginTop: 4, fontSize: 13 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </div>
    </div>
  )
}
