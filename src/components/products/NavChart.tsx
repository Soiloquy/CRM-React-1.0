import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { NavPoint } from '@/types/product'

interface Props {
  data: NavPoint[]
  height?: number
}

export default function NavChart({ data, height }: Props) {
  return (
    <div style={{ width: '100%', height: height || '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#f0f0f0' }}
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => val.toFixed(2)}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(4), '净值']}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="nav"
            stroke="#1677ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
