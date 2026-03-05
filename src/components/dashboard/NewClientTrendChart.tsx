import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { NewClientTrendPoint } from '@/types/common'

interface Props {
  data: NewClientTrendPoint[]
}

export default function NewClientTrendChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="clientTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1677ff" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#f0f0f0' }}
            tickFormatter={(val) => {
              const parts = val.split('-')
              return `${parts[1]}月`
            }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value} 人`, '新增客户']}
            labelFormatter={(label: string) => {
              const parts = label.split('-')
              return `${parts[0]}年${parts[1]}月`
            }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#1677ff"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#fff', stroke: '#1677ff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#1677ff', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
