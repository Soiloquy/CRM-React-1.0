import type { FollowUp, FollowUpType } from '@/types/holding'
import { mockClients } from './clients'

const followUpTypes: FollowUpType[] = ['phone', 'visit', 'wechat', 'email']

const contentTemplates: Record<FollowUpType, string[]> = {
  phone: [
    '电话沟通近期市场行情，客户关注科技板块表现',
    '回访客户，了解对当前持仓的看法，客户表示满意',
    '电话推荐新发基金产品，客户表示有兴趣了解',
    '提醒客户即将到期的理财产品，沟通续投方案',
    '电话回访产品收益情况，客户希望增加债券配置',
    '沟通年度资产配置方案，客户倾向稳健策略',
    '回访客户新购产品体验，反馈较好',
    '电话通知客户产品分红事宜',
  ],
  visit: [
    '上门拜访客户，详细讲解新产品投资策略',
    '年度回访，与客户面谈资产配置调整方案',
    '拜访客户公司，了解客户资金需求变化',
    '携带季度报告上门拜访，客户满意度较高',
    '与客户面谈，了解其家庭理财规划需求',
    '上门签署产品申购协议',
  ],
  wechat: [
    '微信发送每日市场简报，客户已读',
    '微信分享行业研究报告，客户表示感谢',
    '微信沟通产品净值变动情况',
    '微信推送新产品介绍材料',
    '微信回复客户关于赎回流程的咨询',
    '微信群发节日问候',
    '通过微信解答客户关于风险等级调整的疑问',
  ],
  email: [
    '发送月度投资报告至客户邮箱',
    '发送产品说明书及风险揭示书',
    '邮件发送年度资产配置建议方案',
    '发送季度持仓分析报告',
    '邮件通知产品经理变更事项',
    '发送VIP客户专属活动邀请函',
  ],
}

const salesNames = ['张明', '李晓红', '王建国', '赵芳', '陈伟']

function randomRecent(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
  return d.toISOString()
}

export const mockFollowUps: FollowUp[] = Array.from({ length: 40 }, (_, idx) => {
  const clientIdx = idx % Math.min(25, mockClients.length)
  const client = mockClients[clientIdx]
  const type = followUpTypes[idx % followUpTypes.length]
  const templates = contentTemplates[type]
  const content = templates[idx % templates.length]

  return {
    id: `followup_${String(idx + 1).padStart(3, '0')}`,
    clientId: client.id,
    clientName: client.name,
    type,
    content,
    createdAt: randomRecent(90),
    createdBy: salesNames[idx % salesNames.length],
  }
}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
