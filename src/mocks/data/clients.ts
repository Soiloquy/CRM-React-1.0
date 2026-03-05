import type { Client, ClientLevel, ClientRiskLevel } from '@/types/client'

const surnames = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
]

const givenNames = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
  '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平',
  '刚', '桂英', '文', '云', '建华', '玉兰', '建国', '淑珍', '志强', '建军',
  '雪', '峰', '辉', '浩', '宇', '嘉', '琳', '梅', '博', '思远',
]

const cities = [
  '北京市朝阳区', '上海市浦东新区', '深圳市南山区', '广州市天河区',
  '杭州市西湖区', '南京市鼓楼区', '成都市高新区', '武汉市武昌区',
  '重庆市渝北区', '苏州市工业园区', '天津市南开区', '西安市雁塔区',
  '长沙市岳麓区', '青岛市市南区', '大连市中山区', '厦门市思明区',
  '宁波市鄞州区', '无锡市滨湖区', '郑州市金水区', '合肥市蜀山区',
]

const levels: ClientLevel[] = ['vip', 'normal', 'potential']
const riskLevels: ClientRiskLevel[] = ['conservative', 'stable', 'balanced', 'aggressive', 'radical']

function randomPhone(): string {
  const prefixes = ['138', '139', '136', '137', '186', '187', '158', '159', '188', '189', '130', '131', '132', '155', '156', '185']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  let rest = ''
  for (let i = 0; i < 8; i++) {
    rest += Math.floor(Math.random() * 10)
  }
  return prefix + rest
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

function randomRecent(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  return d.toISOString().split('T')[0]
}

export const mockClients: Client[] = Array.from({ length: 35 }, (_, idx) => {
  const surname = surnames[idx % surnames.length]
  const given = givenNames[idx % givenNames.length]
  const name = surname + given
  const level = idx < 8 ? 'vip' : idx < 22 ? 'normal' : 'potential'
  const riskLevel = riskLevels[idx % riskLevels.length]

  const totalAssets =
    level === 'vip'
      ? 500e4 + Math.random() * 2000e4
      : level === 'normal'
        ? 50e4 + Math.random() * 450e4
        : Math.random() * 50e4

  return {
    id: `client_${String(idx + 1).padStart(3, '0')}`,
    name,
    phone: randomPhone(),
    email: `${name.toLowerCase().replace(/\s/g, '')}${idx}@example.com`,
    level: level as ClientLevel,
    riskLevel,
    address: cities[idx % cities.length],
    totalAssets: Math.round(totalAssets * 100) / 100,
    createdAt: randomDate(2020, 2025),
    lastFollowUp: randomRecent(60),
    notes: level === 'vip'
      ? '重点客户，需定期回访维护关系'
      : level === 'normal'
        ? '正常维护客户'
        : '潜在客户，需进一步开发',
  }
})
