import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MasterHubPage from './pages/MasterHubPage'
import MetricUnitsPage from './pages/MetricUnitsPage'
import TestParametersPage from './pages/TestParametersPage'
import AnalystQualificationsPage from './pages/AnalystQualificationsPage'
import InventoryConfigPage from './pages/InventoryConfigPage'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="masters" element={<MasterHubPage />} />
          <Route path="masters/metric-units" element={<MetricUnitsPage />} />
          <Route path="masters/test-parameters" element={<TestParametersPage />} />
          <Route path="masters/analyst-qualifications" element={<AnalystQualificationsPage />} />
          <Route path="masters/inventory-config" element={<InventoryConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
