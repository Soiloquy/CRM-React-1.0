import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ChartItem } from '@/agent/types'

interface Props {
  data: ChartItem[]
  title?: string
}

const COLORS = ['#2E5BFF', '#8C54FF', '#00C1D4', '#F7C137', '#33AC2E', '#D63384', '#FF6B6B', '#4ECDC4']

const RADIAN = Math.PI / 180

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

export default function AgentPieChart({ data, title }: Props) {
  return (
    <div style={{ width: '100%', height: 360, overflow: 'hidden' }}>
      {title && (
        <div style={{ textAlign: 'center', fontWeight: 500, marginBottom: 8, fontSize: 15 }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={title ? 330 : 360}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={105}
            dataKey="value"
            nameKey="label"
            paddingAngle={2}
            label={renderCustomLabel}
            labelLine={false}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            content={({ payload }) => (
              <ul
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 16px',
                  listStyle: 'none',
                  padding: 0,
                  margin: '8px 0 0',
                }}
              >
                {payload?.map((entry, index) => {
                  const item = data.find((d) => d.label === entry.value)
                  return (
                    <li
                      key={index}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: entry.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: '#595959', fontSize: 13 }}>
                        {entry.value}（{item?.value ?? 0}）
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
