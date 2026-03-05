import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { RiskTypeAnalysisItem } from '@/types/common'

interface Props {
  data: RiskTypeAnalysisItem[]
}

const formatScale = (value: number) => {
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(0)}万`
  return String(value)
}

const RISK_COLORS = {
  low: '#00C1D4',
  medium: '#F7C137',
  high: '#ff4d4f',
}

export default function RiskTypeAnalysisChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
          barSize={36}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="productType"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#f0f0f0' }}
          />
          <YAxis
            tickFormatter={formatScale}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                low: '低风险',
                medium: '中风险',
                high: '高风险',
              }
              return [formatScale(value), labelMap[name] || name]
            }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            iconType="rect"
            iconSize={12}
            formatter={(value: string) => {
              const labelMap: Record<string, string> = {
                low: '低风险',
                medium: '中风险',
                high: '高风险',
              }
              return (
                <span style={{ color: '#595959', fontSize: 13 }}>
                  {labelMap[value] || value}
                </span>
              )
            }}
          />
          <Bar
            dataKey="low"
            stackId="risk"
            fill={RISK_COLORS.low}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="risk"
            fill={RISK_COLORS.medium}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="high"
            stackId="risk"
            fill={RISK_COLORS.high}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
