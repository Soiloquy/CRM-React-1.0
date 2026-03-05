export interface Client {
  id: string
  name: string
  phone: string
  email: string
  level: ClientLevel
  riskLevel: ClientRiskLevel
  address: string
  totalAssets: number
  createdAt: string
  lastFollowUp: string
  notes: string
}

export type ClientLevel = 'vip' | 'normal' | 'potential'

export type ClientRiskLevel =
  | 'conservative'
  | 'stable'
  | 'balanced'
  | 'aggressive'
  | 'radical'

export const CLIENT_LEVEL_MAP: Record<ClientLevel, string> = {
  vip: 'VIP',
  normal: '普通',
  potential: '潜在',
}

export const CLIENT_LEVEL_COLOR: Record<ClientLevel, string> = {
  vip: 'gold',
  normal: 'blue',
  potential: 'default',
}

export const CLIENT_RISK_LEVEL_MAP: Record<ClientRiskLevel, string> = {
  conservative: '保守型',
  stable: '稳健型',
  balanced: '平衡型',
  aggressive: '积极型',
  radical: '激进型',
}
