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
import PayloadInwardPage from './pages/PayloadInwardPage'
import QcRequestsPage from './pages/QcRequestsPage'
import QcRequestTrackingPage from './pages/QcRequestTrackingPage'
import UploadTrfPage from './pages/UploadTrfPage'
import GenerateArPage from './pages/GenerateArPage'
import AssignedTestsPage from './pages/AssignedTestsPage'
import SubmitTestExecutionPage from './pages/SubmitTestExecutionPage'
import IncidentsPage from './pages/IncidentsPage'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import { Rights } from './constants/rights'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* QC Operational Routes */}
            <Route
              path="payload-inward"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_QC_REQUEST_CREATE, Rights.ROLE_QC_REQUEST_READ]}>
                  <PayloadInwardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="qc-requests"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_QC_REQUEST_READ]}>
                  <QcRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="qc-request-tracking"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_QC_REQUEST_TRACKING_READ]}>
                  <QcRequestTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="upload-trfs"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_TRF_READ, Rights.ROLE_TRF_UPLOAD]}>
                  <UploadTrfPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="generate-ar"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_AR_GENERATE_READ, Rights.ROLE_AR_GENERATE_CREATE]}>
                  <GenerateArPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="assigned-tests"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_ASSIGNED_TESTS_READ, Rights.ROLE_TEST_EXECUTE, Rights.ROLE_TEST_REVIEW]}>
                  <AssignedTestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="assigned-tests/:detailId/submit"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_TEST_EXECUTE]}>
                  <SubmitTestExecutionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="incidents"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_INCIDENTS_READ, Rights.ROLE_INCIDENTS_RESOLVE]}>
                  <IncidentsPage />
                </ProtectedRoute>
              }
            />

            {/* Masters Routes */}
            <Route
              path="masters"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_MASTER_DATA_READ, Rights.ROLE_METRIC_READ, Rights.ROLE_TEST_PARAMETER_READ, Rights.ROLE_QUALIFICATION_READ, Rights.ROLE_INVENTORY_CONFIG_READ, Rights.ROLE_METRIC_SPECIFICATION_READ]}>
                  <MasterHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="masters/metrics"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_METRIC_READ, Rights.ROLE_MASTER_DATA_READ]}>
                  <MetricsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="masters/test-parameters"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_TEST_PARAMETER_READ, Rights.ROLE_MASTER_DATA_READ]}>
                  <TestParametersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="masters/analyst-qualifications"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_QUALIFICATION_READ, Rights.ROLE_MASTER_DATA_READ]}>
                  <AnalystQualificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="masters/inventory-config"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_INVENTORY_CONFIG_READ, Rights.ROLE_MASTER_DATA_READ]}>
                  <InventoryConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="masters/metric-specifications"
              element={
                <ProtectedRoute requireAnyRight={[Rights.ROLE_SYSTEM_ADMIN, Rights.ROLE_METRIC_SPECIFICATION_READ, Rights.ROLE_MASTER_DATA_READ]}>
                  <MetricSpecificationsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
