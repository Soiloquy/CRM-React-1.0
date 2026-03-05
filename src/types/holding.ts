export interface Holding {
  id: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  productCode: string
  shares: number
  amount: number
  buyDate: string
  returnRate: number
}

export interface FollowUp {
  id: string
  clientId: string
  clientName: string
  type: FollowUpType
  content: string
  createdAt: string
  createdBy: string
}

export type FollowUpType = 'phone' | 'visit' | 'wechat' | 'email'

export const FOLLOW_UP_TYPE_MAP: Record<FollowUpType, string> = {
  phone: '电话',
  visit: '拜访',
  wechat: '微信',
  email: '邮件',
}

export const FOLLOW_UP_TYPE_COLOR: Record<FollowUpType, string> = {
  phone: 'blue',
  visit: 'green',
  wechat: 'cyan',
  email: 'purple',
}
