import type { Product, ProductType, ProductStatus, NavPoint } from '@/types/product'

function generateNavHistory(baseNav: number, days = 30): NavPoint[] {
  const history: NavPoint[] = []
  let nav = baseNav * (0.85 + Math.random() * 0.1)
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue
    nav = nav * (1 + (Math.random() - 0.48) * 0.03)
    history.push({
      date: date.toISOString().split('T')[0],
      nav: Math.round(nav * 10000) / 10000,
    })
  }
  return history
}

const types: ProductType[] = ['equity', 'bond', 'hybrid', 'money_market', 'index', 'qdii']
const statuses: ProductStatus[] = ['active', 'raising', 'suspended', 'liquidated']

const managers = [
  '张鹏', '李婷', '王强', '赵敏', '陈晓', '刘洋', '孙伟', '周红',
  '吴刚', '郑雪', '黄磊', '林清', '马骏', '杨帆', '朱明',
]

const companies = [
  '华夏基金', '南方基金', '易方达基金', '嘉实基金', '博时基金',
  '广发基金', '招商基金', '工银瑞信', '汇添富基金', '富国基金',
]

const custodians = [
  '中国工商银行', '中国建设银行', '中国银行', '中国农业银行',
  '招商银行', '交通银行', '兴业银行',
]

interface ProductTemplate {
  name: string
  type: ProductType
  navBase: number
  scale: number
  status: ProductStatus
}

const productTemplates: ProductTemplate[] = [
  { name: '华夏成长先锋混合', type: 'hybrid', navBase: 2.3456, scale: 85.6e8, status: 'active' },
  { name: '南方优质蓝筹股票', type: 'equity', navBase: 3.1234, scale: 120.3e8, status: 'active' },
  { name: '易方达稳健收益债券A', type: 'bond', navBase: 1.2567, scale: 45.2e8, status: 'active' },
  { name: '嘉实货币市场基金A', type: 'money_market', navBase: 1.0000, scale: 230.5e8, status: 'active' },
  { name: '博时沪深300指数A', type: 'index', navBase: 1.8765, scale: 92.1e8, status: 'active' },
  { name: '广发纳斯达克100QDII', type: 'qdii', navBase: 2.5678, scale: 68.4e8, status: 'active' },
  { name: '招商中证白酒指数', type: 'index', navBase: 1.5432, scale: 156.7e8, status: 'active' },
  { name: '工银瑞信前沿医疗股票', type: 'equity', navBase: 1.9876, scale: 43.2e8, status: 'active' },
  { name: '汇添富消费行业混合', type: 'hybrid', navBase: 4.5678, scale: 178.9e8, status: 'active' },
  { name: '富国天惠精选成长A', type: 'hybrid', navBase: 3.8901, scale: 210.4e8, status: 'active' },
  { name: '华夏新能源车龙头混合', type: 'hybrid', navBase: 0.8765, scale: 35.6e8, status: 'active' },
  { name: '南方中债1-3年国开行债券', type: 'bond', navBase: 1.0567, scale: 88.9e8, status: 'active' },
  { name: '易方达中小盘混合', type: 'hybrid', navBase: 5.1234, scale: 265.3e8, status: 'active' },
  { name: '嘉实新兴产业股票', type: 'equity', navBase: 2.7890, scale: 67.8e8, status: 'active' },
  { name: '博时信用债券A', type: 'bond', navBase: 1.3456, scale: 52.1e8, status: 'active' },
  { name: '广发科技先锋混合', type: 'hybrid', navBase: 1.2345, scale: 98.7e8, status: 'active' },
  { name: '招商安泰债券A', type: 'bond', navBase: 1.1890, scale: 34.5e8, status: 'active' },
  { name: '工银瑞信全球精选QDII', type: 'qdii', navBase: 1.6789, scale: 28.3e8, status: 'active' },
  { name: '汇添富价值精选混合A', type: 'hybrid', navBase: 3.2345, scale: 145.6e8, status: 'active' },
  { name: '富国沪深300ETF联接', type: 'index', navBase: 1.7654, scale: 112.4e8, status: 'active' },
  { name: '华夏恒生科技ETF联接QDII', type: 'qdii', navBase: 0.7890, scale: 56.7e8, status: 'suspended' },
  { name: '南方转型增长混合', type: 'hybrid', navBase: 1.0123, scale: 12.3e8, status: 'suspended' },
  { name: '易方达安心回馈混合', type: 'hybrid', navBase: 1.4567, scale: 23.4e8, status: 'suspended' },
  { name: '嘉实增强信用债券', type: 'bond', navBase: 1.1234, scale: 18.9e8, status: 'suspended' },
  { name: '博时量化多策略股票A', type: 'equity', navBase: 0.9876, scale: 8.5e8, status: 'suspended' },
  { name: '广发集裕债券A', type: 'bond', navBase: 1.0012, scale: 5.6e8, status: 'liquidated' },
  { name: '招商安润保本混合', type: 'hybrid', navBase: 0.5678, scale: 2.1e8, status: 'liquidated' },
  { name: '工银瑞信互联网加股票', type: 'equity', navBase: 0.4321, scale: 1.8e8, status: 'liquidated' },
  { name: '华夏半导体龙头混合', type: 'hybrid', navBase: 1.6543, scale: 76.2e8, status: 'raising' },
  { name: '南方养老目标2035混合', type: 'hybrid', navBase: 1.1987, scale: 15.8e8, status: 'raising' },
  { name: '易方达蓝筹精选混合', type: 'hybrid', navBase: 1.8234, scale: 320.1e8, status: 'active' },
  { name: '嘉实沪港深精选股票', type: 'equity', navBase: 1.5678, scale: 42.3e8, status: 'raising' },
  { name: '博时黄金ETF联接A', type: 'index', navBase: 1.3210, scale: 38.9e8, status: 'active' },
]

function generateCode(index: number): string {
  return String(100001 + index).padStart(6, '0')
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

const riskLevels = ['conservative', 'stable', 'balanced', 'aggressive', 'radical'] as const

export const mockProducts: Product[] = productTemplates.map((tpl, idx) => {
  const navHistory = generateNavHistory(tpl.navBase)
  const currentNav = navHistory[navHistory.length - 1]?.nav ?? tpl.navBase
  const prevNav = navHistory[navHistory.length - 2]?.nav ?? tpl.navBase
  const dailyReturn = (currentNav - prevNav) / prevNav

  return {
    id: `prod_${String(idx + 1).padStart(3, '0')}`,
    code: generateCode(idx),
    name: tpl.name,
    type: tpl.type,
    status: tpl.status,
    nav: currentNav,
    cumulativeNav: currentNav + Math.random() * 1.5,
    dailyReturn,
    scale: tpl.scale * (0.9 + Math.random() * 0.2),
    manager: managers[idx % managers.length],
    managementCompany: companies[idx % companies.length],
    custodian: custodians[idx % custodians.length],
    establishDate: randomDate(2015, 2023),
    riskLevel: tpl.type === 'money_market'
      ? 'conservative'
      : tpl.type === 'bond'
        ? riskLevels[Math.floor(Math.random() * 2)]
        : riskLevels[Math.floor(Math.random() * 5)],
    description: `${tpl.name}是一款${tpl.type === 'equity' ? '股票型' : tpl.type === 'bond' ? '债券型' : tpl.type === 'hybrid' ? '混合型' : tpl.type === 'money_market' ? '货币型' : tpl.type === 'index' ? '指数型' : 'QDII'}基金，由经验丰富的基金经理管理，致力于为投资者创造稳健回报。`,
    navHistory,
  }
})
