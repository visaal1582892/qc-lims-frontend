import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MasterHubPage from './pages/MasterHubPage'
import MetricsPage from './pages/MetricsPage'
import TestParametersPage from './pages/TestParametersPage'
import AnalystQualificationsPage from './pages/AnalystQualificationsPage'
import InventoryConfigPage from './pages/InventoryConfigPage'
import MetricSpecificationsPage from './pages/MetricSpecificationsPage'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="masters" element={<MasterHubPage />} />
            <Route path="masters/metrics" element={<MetricsPage />} />
            <Route path="masters/test-parameters" element={<TestParametersPage />} />
            <Route path="masters/analyst-qualifications" element={<AnalystQualificationsPage />} />
            <Route path="masters/inventory-config" element={<InventoryConfigPage />} />
            <Route path="masters/metric-specifications" element={<MetricSpecificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
