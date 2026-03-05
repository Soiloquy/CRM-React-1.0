import dayjs from 'dayjs'

export function formatCurrency(value: number): string {
  if (value >= 1e8) {
    return `${(value / 1e8).toFixed(2)}亿`
  }
  if (value >= 1e4) {
    return `${(value / 1e4).toFixed(2)}万`
  }
  return value.toFixed(2)
}

export function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(2)}%`
}

export function formatDate(date: string, template = 'YYYY-MM-DD'): string {
  return dayjs(date).format(template)
}

export function formatNav(value: number): string {
  return value.toFixed(4)
}

export function formatScale(value: number): string {
  if (value >= 1e8) {
    return `${(value / 1e8).toFixed(2)}亿`
  }
  if (value >= 1e4) {
    return `${(value / 1e4).toFixed(2)}万`
  }
  return `${value.toFixed(2)}元`
}
