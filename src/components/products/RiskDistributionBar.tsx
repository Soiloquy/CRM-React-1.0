import { Tooltip } from 'antd'

interface Props {
  low: number
  medium: number
  high: number
}

export default function RiskDistributionBar({ low, medium, high }: Props) {
  const total = low + medium + high
  if (total === 0) {
    return (
      <div style={{ color: '#8c8c8c', fontSize: 13 }}>暂无持仓数据</div>
    )
  }

  const lowPct = (low / total) * 100
  const medPct = (medium / total) * 100
  const highPct = (high / total) * 100

  const formatAmount = (v: number) => {
    if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`
    if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`
    return v.toFixed(2)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 24,
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {lowPct > 0 && (
          <Tooltip title={`低风险: ${formatAmount(low)} (${lowPct.toFixed(1)}%)`}>
            <div
              style={{
                width: `${lowPct}%`,
                background: '#52c41a',
                transition: 'width 0.3s ease',
                minWidth: lowPct > 3 ? undefined : 4,
              }}
            />
          </Tooltip>
        )}
        {medPct > 0 && (
          <Tooltip title={`中风险: ${formatAmount(medium)} (${medPct.toFixed(1)}%)`}>
            <div
              style={{
                width: `${medPct}%`,
                background: '#faad14',
                transition: 'width 0.3s ease',
                minWidth: medPct > 3 ? undefined : 4,
              }}
            />
          </Tooltip>
        )}
        {highPct > 0 && (
          <Tooltip title={`高风险: ${formatAmount(high)} (${highPct.toFixed(1)}%)`}>
            <div
              style={{
                width: `${highPct}%`,
                background: '#ff4d4f',
                transition: 'width 0.3s ease',
                minWidth: highPct > 3 ? undefined : 4,
              }}
            />
          </Tooltip>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#595959' }}>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#52c41a',
              marginRight: 4,
            }}
          />
          低风险 {lowPct.toFixed(1)}%
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#faad14',
              marginRight: 4,
            }}
          />
          中风险 {medPct.toFixed(1)}%
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ff4d4f',
              marginRight: 4,
            }}
          />
          高风险 {highPct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
