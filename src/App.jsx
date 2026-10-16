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
import { TestAllocationPage } from './pages/testExecution/TestAllocationPage'
import { TestExecutionPage } from './pages/testExecution/TestExecutionPage'
import { QcReviewQueuePage } from './pages/review/QcReviewQueuePage'
import { QaReviewQueuePage } from './pages/review/QaReviewQueuePage'
import { ReviewDetailPage } from './pages/review/ReviewDetailPage'
import { OosIncidentsPage } from './pages/oos/OosIncidentsPage'
import { TrialTestsPage } from './pages/trialTests/TrialTestsPage'
import { SubcontractRegisterPage } from './pages/subcontracting/SubcontractRegisterPage'
import { DocumentRegistryPage } from './pages/documents/DocumentRegistryPage'
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
            <Route path={AppRoutes.TEST_ALLOCATION} element={
              <ProtectedRoute>
                <TestAllocationPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.TEST_EXECUTION} element={
              <ProtectedRoute>
                <TestExecutionPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.QC_REVIEW_QUEUE} element={
              <ProtectedRoute>
                <QcReviewQueuePage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.QA_REVIEW_QUEUE} element={
              <ProtectedRoute>
                <QaReviewQueuePage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.REVIEW_DETAIL} element={
              <ProtectedRoute>
                <ReviewDetailPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.OOS_INCIDENTS} element={
              <ProtectedRoute>
                <OosIncidentsPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.OOS_INCIDENT_DETAIL} element={
              <ProtectedRoute>
                <OosIncidentsPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.TRIAL_TESTS} element={
              <ProtectedRoute>
                <TrialTestsPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.SUBCONTRACT_REGISTER} element={
              <ProtectedRoute>
                <SubcontractRegisterPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.SUBCONTRACT_DETAIL} element={
              <ProtectedRoute>
                <SubcontractRegisterPage />
              </ProtectedRoute>
            } />
            <Route path={AppRoutes.DOCUMENT_REGISTRY} element={
              <ProtectedRoute>
                <DocumentRegistryPage />
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
