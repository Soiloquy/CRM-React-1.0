import { List, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import type { FollowUp } from '@/types/holding'
import { FOLLOW_UP_TYPE_MAP, FOLLOW_UP_TYPE_COLOR } from '@/types/holding'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface Props {
  data: FollowUp[]
  loading?: boolean
}

export default function RecentFollowUps({ data, loading }: Props) {
  const navigate = useNavigate()

  return (
    <List
      loading={loading}
      dataSource={data.slice(0, 5)}
      renderItem={(item) => (
        <List.Item
          style={{ padding: '12px 0', cursor: 'pointer' }}
          onClick={() => navigate(`/clients/${item.clientId}`)}
        >
          <div style={{ width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Typography.Text strong style={{ fontSize: 14 }}>
                {item.clientName}
              </Typography.Text>
              <Tag
                color={FOLLOW_UP_TYPE_COLOR[item.type]}
                style={{ marginRight: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
              >
                {FOLLOW_UP_TYPE_MAP[item.type]}
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto', flexShrink: 0 }}>
                {dayjs(item.createdAt).fromNow()}
              </Typography.Text>
            </div>
            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: 13, margin: 0 }}
              ellipsis={{ rows: 1 }}
            >
              {item.content}
            </Typography.Paragraph>
          </div>
        </List.Item>
      )}
    />
  )
}
