import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { Routes as AppRoutes } from './constants/routes'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect home to dashboard */}
          <Route path={AppRoutes.HOME} element={<Navigate to={AppRoutes.DASHBOARD} replace />} />

          {/* Layout-wrapped routes */}
          <Route element={<AppLayout><Routes><Route path={AppRoutes.DASHBOARD} element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } /></Routes></AppLayout>}>
            <Route path={AppRoutes.DASHBOARD} element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={AppRoutes.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
