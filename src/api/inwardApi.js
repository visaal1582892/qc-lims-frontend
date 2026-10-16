import api from './client'

/**
 * API module for Sample Inward Registration endpoints (Module 2).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 */
export const inwardApi = {
  /**
   * List all inward registrations.
   */
  getAll: () => api.get('/inward'),

  /**
   * Get a single inward record by ID.
   */
  getById: (id) => api.get(`/inward/${id}`),

  /**
   * Search inward registrations by batch number.
   */
  searchByBatch: (batchNo) => api.get('/inward/search/batch', { params: { batchNo } }),

  /**
   * Create a new inward registration (AR number generated server-side).
   */
  create: (data) => api.post('/inward', data),

  /**
   * Update an existing inward registration.
   */
  update: (id, data) => api.put(`/inward/${id}`, data),

  /**
   * Soft-delete an inward registration (sets status to INACTIVE).
   */
  delete: (id) => api.delete(`/inward/${id}`),
}
