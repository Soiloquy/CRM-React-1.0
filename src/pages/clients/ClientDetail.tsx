import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  Button,
  Table,
  Result,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  useClientDetail,
  useClientHoldings,
  useClientFollowUps,
  useCreateFollowUp,
} from '@/hooks/useClients'
import {
  CLIENT_LEVEL_MAP,
  CLIENT_LEVEL_COLOR,
  CLIENT_RISK_LEVEL_MAP,
} from '@/types/client'
import {
  FOLLOW_UP_TYPE_MAP,
  FOLLOW_UP_TYPE_COLOR,
  type FollowUpType,
} from '@/types/holding'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import { useAppStore } from '@/stores/useAppStore'
import type { Holding } from '@/types/holding'
import type { ColumnsType } from 'antd/es/table'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: client, isLoading, error } = useClientDetail(id!)
  const { data: holdings, isLoading: holdingsLoading } = useClientHoldings(id!)
  const { data: followUps, isLoading: fuLoading } = useClientFollowUps(id!)
  const createFollowUp = useCreateFollowUp(id!)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <Result
        status="404"
        title="客户未找到"
        subTitle="该客户不存在或已被删除"
        extra={
          <Button type="primary" onClick={() => navigate('/clients')}>
            返回客户列表
          </Button>
        }
      />
    )
  }

  const holdingColumns: ColumnsType<Holding> = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      render: (name: string, record: Holding) => (
        <Link to={`/products/${record.productId}`}>{name}</Link>
      ),
    },
    {
      title: '产品代码',
      dataIndex: 'productCode',
      width: 110,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace' }}>{code}</span>
      ),
    },
    {
      title: '持有份额',
      dataIndex: 'shares',
      align: 'right',
      render: (val: number) =>
        val.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
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

  const handleCreateFollowUp = async () => {
    try {
      const values = await form.validateFields()
      await createFollowUp.mutateAsync({
        type: values.type,
        content: values.content,
        createdBy: currentUser.name,
      })
      message.success('跟进记录添加成功')
      form.resetFields()
      setFollowUpOpen(false)
    } catch {
      // validation error, do nothing
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/clients')}
        >
          返回列表
        </Button>
      </Space>

      <Card title="客户信息" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
          <Descriptions.Item label="客户姓名">
            {client.name}
          </Descriptions.Item>
          <Descriptions.Item label="客户等级">
            <Tag color={CLIENT_LEVEL_COLOR[client.level]}>
              {CLIENT_LEVEL_MAP[client.level]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="风险偏好">
            {CLIENT_RISK_LEVEL_MAP[client.riskLevel]}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {client.phone}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {client.email}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {client.address}
          </Descriptions.Item>
          <Descriptions.Item label="总资产">
            <span style={{ fontWeight: 600, fontSize: 16, color: '#1677ff' }}>
              {formatCurrency(client.totalAssets)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="最近跟进">
            {formatDate(client.lastFollowUp)}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDate(client.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {client.notes || '无'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="持仓信息" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          columns={holdingColumns}
          dataSource={holdings}
          loading={holdingsLoading}
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>

      <Card
        title="跟进记录"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFollowUpOpen(true)}
          >
            新增跟进
          </Button>
        }
      >
        {fuLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : followUps?.length ? (
          <Timeline
            items={followUps.map((fu) => ({
              color: FOLLOW_UP_TYPE_COLOR[fu.type as FollowUpType] || 'blue',
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <Tag
                      color={
                        FOLLOW_UP_TYPE_COLOR[fu.type as FollowUpType] || 'blue'
                      }
                    >
                      {FOLLOW_UP_TYPE_MAP[fu.type as FollowUpType] || fu.type}
                    </Tag>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {formatDate(fu.createdAt, 'YYYY-MM-DD HH:mm')} /{' '}
                      {fu.createdBy}
                    </span>
                  </div>
                  <div style={{ color: '#595959', fontSize: 14 }}>
                    {fu.content}
                  </div>
                </div>
              ),
            }))}
          />
        ) : (
          <div
            style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}
          >
            暂无跟进记录
          </div>
        )}
      </Card>

      <Modal
        title="新增跟进记录"
        open={followUpOpen}
        onOk={handleCreateFollowUp}
        onCancel={() => {
          setFollowUpOpen(false)
          form.resetFields()
        }}
        confirmLoading={createFollowUp.isPending}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="type"
            label="跟进方式"
            rules={[{ required: true, message: '请选择跟进方式' }]}
          >
            <Select
              placeholder="请选择"
              options={Object.entries(FOLLOW_UP_TYPE_MAP).map(
                ([key, label]) => ({
                  value: key,
                  label,
                })
              )}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入跟进内容..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
