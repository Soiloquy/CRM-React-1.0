import { http, HttpResponse } from 'msw'
import { API_BASE } from '@/utils/constants'

const VALID_USER = {
  name: '张明',
  password: '123456',
  phone:'13812345678',
  role: '渠道销售经理',
}

export const authHandlers = [
  http.post(`${API_BASE}/auth/login/password`, async ({ request }) => {
    const body = (await request.json()) as { name: string; password: string }
    const { name, password } = body

    if (name === VALID_USER.name && password === VALID_USER.password) {
      const token = 'mock-token-password-login'
      return HttpResponse.json(
        {
          token,
          name: VALID_USER.name,
          role: VALID_USER.role,
        },
        {
          headers: {
            'Set-Cookie': `crm_auth_token=${token}; Max-Age=${12 * 60 * 60}; Path=/`,
          },
        }
      )
    }

    return HttpResponse.json(
      {
        message: '用户名或密码错误',
      },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE}/auth/login/sms`, async ({ request }) => {
    const body = (await request.json()) as { phone: string; code: string }
    const { phone, code } = body

    const isValidPhone = phone === `+86${VALID_USER.phone}`
    const isValidCode = !!code

    if (!isValidPhone) {
      return HttpResponse.json(
        {
          message: '手机号不正确',
        },
        { status: 400 }
      )
    }

    if (!isValidCode) {
      return HttpResponse.json(
        {
          message: '验证码无效',
        },
        { status: 400 }
      )
    }

    const token = 'mock-token-sms-login'

    return HttpResponse.json(
      {
        token,
        name: VALID_USER.name,
        role: VALID_USER.role,
      },
      {
        headers: {
          'Set-Cookie': `crm_auth_token=${token}; Max-Age=${12 * 60 * 60}; Path=/`,
        },
      }
    )
  }),
]

