import api from './client'

/**
 * Dashboard API client (SRS Module 12.1).
 *
 * Endpoints:
 * - GET /dashboard/metrics                    — KPI metrics
 * - GET /dashboard/manufacturer/{id}           — Manufacturer-wise samples
 * - GET /dashboard/analyst/{id}/productivity   — Analyst productivity
 * - GET /dashboard/tracking                    — Date/batch tracking
 * - GET /dashboard/parameters/{id}/analytics   — Parameter analytics
 * - GET /dashboard/status/{status}             — Status filtering
 */
export const dashboardApi = {
  /**
   * GET /api/dashboard/metrics
   * Returns flat KPI metrics response.
   */
  getMetrics: () => api.get('/dashboard/metrics'),

  /**
   * GET /api/dashboard/manufacturer/{id}
   * Returns all samples for a given manufacturer.
   */
  getManufacturerWise: (id) => api.get(`/dashboard/manufacturer/${id}`),

  /**
   * GET /api/dashboard/analyst/{id}/productivity?startDate=&endDate=
   * Returns analyst productivity within a date range.
   */
  getAnalystProductivity: (id, params) => api.get(`/dashboard/analyst/${id}/productivity`, { params }),

  /**
   * GET /api/dashboard/tracking?startDate=&endDate=&batchNo=
   * Returns samples filtered by date range and/or batch number.
   */
  getDateBatchTracking: (params) => api.get('/dashboard/tracking', { params }),

  /**
   * GET /api/dashboard/parameters/{id}/analytics
   * Returns analytics for a specific test parameter.
   */
  getParameterAnalytics: (id) => api.get(`/dashboard/parameters/${id}/analytics`),

  /**
   * GET /api/dashboard/status/{status}
   * Returns samples grouped by lifecycle status.
   */
  getStatusFiltering: (status) => api.get(`/dashboard/status/${status}`),
}
