import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import ProductDetail from './pages/products/ProductDetail'
import ClientList from './pages/clients/ClientList'
import ClientDetail from './pages/clients/ClientDetail'
import AIAgent from './pages/AIAgent'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="ai-agent" element={<AIAgent />} />
      </Route>
    </Routes>
  )
}
