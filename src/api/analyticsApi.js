import api from './client'

/**
 * Analytics API client (SRS Module 12.2).
 */
export const analyticsApi = {
  /**
   * GET /api/dashboard/analytics/samples
   * Multi-dimensional sample search with filters and pagination.
   */
  searchSamples: (params) => api.get('/dashboard/analytics/samples', { params }),

  /**
   * GET /api/dashboard/analytics/summary/by-parameter
   * Parameter-wise aggregated analytics summary.
   */
  summaryByParameter: () => api.get('/dashboard/analytics/summary/by-parameter'),

  /**
   * GET /api/dashboard/analytics/summary/by-analyst?from=&to=
   * Analyst productivity summary for a date range.
   */
  summaryByAnalyst: (from, to) => api.get('/dashboard/analytics/summary/by-analyst', {
    params: { from, to },
  }),
}
