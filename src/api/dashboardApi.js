import api from './client'

/**
 * Dashboard API client (SRS Module 12.1).
 */
export const dashboardApi = {
  /**
   * GET /api/dashboard/metrics
   * Returns flat KPI metrics response.
   */
  getMetrics: () => api.get('/dashboard/metrics'),
}
