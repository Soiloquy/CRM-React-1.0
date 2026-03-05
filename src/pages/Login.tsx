import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Tabs, Form, Input, Button, Typography, message } from 'antd'
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { loginWithPassword, loginWithSms, type LoginResponse } from '@/services/authService'
import { setAuthCookie } from '@/utils/auth'
import { useAppStore } from '@/stores/useAppStore'

const { Title, Text } = Typography

type PasswordFormValues = {
  name: string
  password: string
}

type SmsFormValues = {
  phone: string
  code: string
}

const PHONE_REGEX = /^\d{11}$/

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  const [passwordLoading, setPasswordLoading] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [smsForm] = Form.useForm<SmsFormValues>()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const handlePasswordFinish = async (values: PasswordFormValues) => {
    try {
      setPasswordLoading(true)
      const res = (await loginWithPassword(values)) as unknown as LoginResponse
      setAuthCookie(res.token)
      setCurrentUser({
        name: res.name,
        role: res.role,
      })
      message.success('登录成功')
      const redirectPath = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(redirectPath, { replace: true })
    } catch (e: any) {
      message.error(e?.response?.data?.message || '登录失败，请检查用户名和密码')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleGetCode = async () => {
    const phone = smsForm.getFieldValue('phone')
    if (!phone || !PHONE_REGEX.test(phone)) {
      message.warning('请输入正确的手机号')
      return
    }
    const autoCode = '123456'
    smsForm.setFieldsValue({ code: autoCode })
    setCountdown(60)
    message.success('验证码已发送（已自动填入，仅用于演示）')
  }

  const handleSmsFinish = async (values: SmsFormValues) => {
    try {
      setSmsLoading(true)
      const payload = {
        phone: `+86${values.phone}`,
        code: values.code,
      }
      const res = (await loginWithSms(payload)) as unknown as LoginResponse
      setAuthCookie(res.token)
      setCurrentUser({
        name: res.name,
        role: res.role,
      })
      message.success('登录成功')
      const redirectPath = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(redirectPath, { replace: true })
    } catch (e: any) {
      message.error(e?.response?.data?.message || '登录失败，请稍后重试')
    } finally {
      setSmsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 0 0, rgba(22, 119, 255, 0.08), transparent 60%), radial-gradient(circle at 100% 100%, rgba(82, 196, 26, 0.08), transparent 55%), #f5f5f5',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
          borderRadius: 16,
        }}
        styles={{
          body: { padding: '32px 32px 28px' },
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            CRM 管理系统登录
          </Title>
          <Text type="secondary">请使用账号密码或手机验证码登录系统</Text>
        </div>

        <Tabs
          defaultActiveKey="password"
          items={[
            {
              key: 'password',
              label: '账号密码登录',
              children: (
                <Form<PasswordFormValues>
                  layout="vertical"
                  onFinish={handlePasswordFinish}
                  initialValues={{ name: '张明', password: '123456' }}
                >
                  <Form.Item
                    name="name"
                    label="用户姓名"
                    rules={[{ required: true, message: '请输入用户姓名' }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="请输入用户姓名"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="请输入密码"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={passwordLoading}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'sms',
              label: '手机验证码登录',
              children: (
                <Form<SmsFormValues> layout="vertical" form={smsForm} onFinish={handleSmsFinish}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      {
                        pattern: PHONE_REGEX,
                        message: '请输入正确的 11 位手机号，例如 13812345678',
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="请输入手机号"
                    />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="短信验证码"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Input
                      size="large"
                      placeholder="请输入验证码"
                      addonAfter={
                        <Button
                          type="link"
                          style={{ padding: 0 }}
                          onClick={handleGetCode}
                          disabled={countdown > 0}
                        >
                          {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                        </Button>
                      }
                    />
                  </Form.Item>
                  <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      loading={smsLoading}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

