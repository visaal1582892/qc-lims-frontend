import api from './client'

/**
 * API module for e-TRF Management endpoints (Module 3).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 */
export const trfApi = {
  /**
   * List all e-TRFs.
   */
  getAll: () => api.get('/trf'),

  /**
   * Get a single e-TRF by ID.
   */
  getById: (id) => api.get(`/trf/${id}`),

  /**
   * List e-TRFs by status (Pending_Feasibility, Accepted, Rejected).
   */
  getByStatus: (status) => api.get(`/trf/status/${status}`),

  /**
   * Search e-TRFs by GRN number.
   */
  searchByGrn: (grnNumber) => api.get('/trf/search/grn', { params: { grnNumber } }),

  /**
   * Create a new e-TRF.
   */
  create: (data) => api.post('/trf', data),

  /**
   * Update an existing e-TRF.
   */
  update: (id, data) => api.put(`/trf/${id}`, data),

  /**
   * Soft-delete an e-TRF.
   */
  delete: (id) => api.delete(`/trf/${id}`),

  /**
   * Accept e-TRF (feasibility approval).
   */
  accept: (id) => api.post(`/trf/${id}/accept`),

  /**
   * Reject e-TRF (feasibility rejection).
   */
  reject: (id) => api.post(`/trf/${id}/reject`),

  /**
   * Assign test parameters to e-TRF (QC Head).
   */
  assignParameters: (id, parameterIds) => api.post(`/trf/${id}/assign-parameters`, parameterIds),
}
