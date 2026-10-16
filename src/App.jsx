import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { TestParameterListPage } from './pages/testParameter/TestParameterListPage'
import { InwardListPage } from './pages/inward/InwardListPage'
import { TrfListPage } from './pages/trf/TrfListPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { InventoryListPage } from './pages/inventory/InventoryListPage'
import { InventoryDetailPage } from './pages/inventory/InventoryDetailPage'
import { InventoryVariancePage } from './pages/inventory/InventoryVariancePage'
import { Routes as AppRoutes } from './constants/routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={AppRoutes.HOME} element={<Navigate to={AppRoutes.DASHBOARD} replace />} />
          <Route path={AppRoutes.LOGIN} element={<Navigate to={AppRoutes.DASHBOARD} replace />} />

          <Route element={<AppLayout />}>
            <Route path={AppRoutes.DASHBOARD} element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.TEST_PARAMETERS} element={
              <ProtectedRoute>
                <TestParameterListPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.INWARD} element={
              <ProtectedRoute>
                <InwardListPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.TRF} element={
              <ProtectedRoute>
                <TrfListPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.ANALYTICS} element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.INVENTORY} element={
              <ProtectedRoute>
                <InventoryListPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.INVENTORY_DETAIL} element={
              <ProtectedRoute>
                <InventoryDetailPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.INVENTORY_VARIANCE} element={
              <ProtectedRoute>
                <InventoryVariancePage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to={AppRoutes.DASHBOARD} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
