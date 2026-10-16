import api from './client'

/**
 * API module for Receipt Checklist endpoints (physical verification).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 */
export const receiptChecklistApi = {
  /**
   * Get receipt checklist by TRF ID.
   */
  getByTrfId: (trfId) => api.get(`/receipt-checklist/trf/${trfId}`),

  /**
   * Create a new receipt checklist.
   */
  create: (data) => api.post('/receipt-checklist', data),

  /**
   * Update an existing receipt checklist.
   */
  update: (checklistId, data) => api.put(`/receipt-checklist/${checklistId}`, data),
}
