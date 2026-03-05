import api from './api'

interface PasswordLoginPayload {
  name: string
  password: string
}

interface SmsLoginPayload {
  phone: string
  code: string
}

export interface LoginResponse {
  token: string
  name: string
  role: string
}

export function loginWithPassword(data: PasswordLoginPayload) {
  return api.post<LoginResponse>('/auth/login/password', data)
}

export function loginWithSms(data: SmsLoginPayload) {
  return api.post<LoginResponse>('/auth/login/sms', data)
}

