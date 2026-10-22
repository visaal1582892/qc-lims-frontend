import api from './client'

/**
 * API module for Multi-Tier Review, Rework & Approval Workflow (Module 7).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 * Base path: /api/v1/reviews
 */
export const reviewWorkflowApi = {
  /**
   * QC Head review decision (APPROVE or REWORK).
   */
  qcHeadReview: (executionId, data) => api.post(`/v1/reviews/qc-head?executionId=${executionId}`, data),

  /**
   * QA Head review decision (APPROVE or REWORK).
   */
  qaHeadReview: (executionId, data) => api.post(`/v1/reviews/qa-head?executionId=${executionId}`, data),

  /**
   * Get QC Head review queue (pending QC reviews).
   */
  getQcReviewQueue: () => api.get('/v1/reviews/qc-head/queue'),

  /**
   * Get QA Head review queue (pending QA reviews).
   */
  getQaReviewQueue: () => api.get('/v1/reviews/qa-head/queue'),

  /**
   * Get review history (audit trail) for an execution.
   */
  getReviewHistory: (executionId) => api.get(`/v1/reviews/${executionId}/history`),

  /**
   * Get full audit log for all review actions.
   */
  getAuditLog: () => api.get('/v1/reviews/audit-log'),
}
