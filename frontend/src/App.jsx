import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import Offers from './pages/Offers'
import Analytics from './pages/Analytics'
import Storefront from './pages/Storefront'

import Help from './pages/Help'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const baseName = import.meta.env.BASE_URL.replace(/\/$/, '') || '/pommastore/admin'
  return (
    <BrowserRouter basename={baseName}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Navigate to="/orders" replace />} />
          <Route path="offers" element={<Offers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="storefront" element={<Storefront />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
