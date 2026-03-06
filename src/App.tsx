import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { AliveScope } from 'react-activation'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AliveScope>
            <AppRouter />
          </AliveScope>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
