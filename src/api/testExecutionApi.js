import api from './client'

/**
 * API module for Test Allocation & Execution State Machine endpoints (Module 6).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 * Base path: /api/test-executions
 */
export const testExecutionApi = {
  /**
   * List all test executions (summary view).
   */
  getAll: () => api.get('/test-executions'),

  /**
   * Get a single test execution by ID (full detail).
   */
  getById: (id) => api.get(`/test-executions/${id}`),

  /**
   * List test executions by AR number.
   */
  getByAr: (arNumber) => api.get(`/test-executions/ar/${arNumber}`),

  /**
   * Get pending allocations (inward samples without active test executions).
   */
  getPending: () => api.get('/test-executions/pending'),

  /**
   * Allocate a test to an analyst.
   */
  allocate: (data) => api.post('/test-executions/allocate', data),

  /**
   * Reassign a test to a different analyst.
   */
  reassign: (id, data) => api.post(`/test-executions/${id}/reassign`, data),

  /**
   * Start testing (Allocated -> Testing).
   */
  start: (id) => api.post(`/test-executions/${id}/start`),

  /**
   * Put test on hold (requires reason).
   */
  hold: (id, data) => api.post(`/test-executions/${id}/hold`, data),

  /**
   * Cancel test (requires reason, QC Head only).
   */
  cancel: (id, data) => api.post(`/test-executions/${id}/cancel`, data),

  /**
   * Submit test result (Testing -> Under_Review).
   */
  submitResult: (id, data) => api.post(`/test-executions/${id}/submit-result`, data),

  /**
   * Approve and release test (Under_Review -> Released).
   */
  approve: (id) => api.post(`/test-executions/${id}/approve`),

  /**
   * Request rework (Under_Review -> Rework_Requested).
   */
  rework: (id, data) => api.post(`/test-executions/${id}/rework`, data),

  /**
   * Resume from rework (Rework_Requested -> Testing).
   */
  resume: (id) => api.post(`/test-executions/${id}/resume`),
}
