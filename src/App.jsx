import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { TestParameterListPage } from './pages/testParameter/TestParameterListPage'
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
          </Route>

          <Route path="*" element={<Navigate to={AppRoutes.DASHBOARD} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
