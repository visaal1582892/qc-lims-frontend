import api from './client'

/**
 * API module for Test Parameter Master endpoints.
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 */
export const testParameterApi = {
  /**
   * List all test parameters or filter by productId / search.
   * @param {Object} params - { productId?: number, search?: string }
   */
  getAll: (params) => api.get('/test-parameters', { params }),

  /**
   * Get a single test parameter by ID.
   */
  getById: (id) => api.get(`/test-parameters/${id}`),

  /**
   * Create a new test parameter.
   */
  create: (data) => api.post('/test-parameters', data),

  /**
   * Update an existing test parameter.
   */
  update: (id, data) => api.put(`/test-parameters/${id}`, data),

  /**
   * Soft-delete a test parameter (sets status to INACTIVE).
   */
  delete: (id) => api.delete(`/test-parameters/${id}`),
}
