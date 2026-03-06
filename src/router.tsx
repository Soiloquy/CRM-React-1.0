import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import KeepAlive from 'react-activation'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import ProductDetail from './pages/products/ProductDetail'
import ClientList from './pages/clients/ClientList'
import ClientDetail from './pages/clients/ClientDetail'
import AIAgent from './pages/AIAgent'
import Login from './pages/Login'
import { isAuthenticated } from '@/utils/auth'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route
          path="ai-agent"
          element={
            <KeepAlive id="ai-agent" name="ai-agent">
              <AIAgent />
            </KeepAlive>
          }
        />
      </Route>
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
