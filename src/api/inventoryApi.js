import api from './client'

/**
 * API module for QC Inventory, Barcoding & Storage Allocation endpoints (Modules 4 & 5).
 *
 * Uses centralized api/client.js — no inline fetch (architecture rule F-A07).
 */
export const inventoryApi = {
  /**
   * List all QC inventory records.
   */
  getAll: () => api.get('/inventory'),

  /**
   * Get a single inventory record by ID.
   */
  getById: (id) => api.get(`/inventory/${id}`),

  /**
   * Search inventory records by batch number.
   */
  searchByBatch: (batchNo) => api.get('/inventory/search/batch', { params: { batchNo } }),

  /**
   * Create a new QC inventory record.
   */
  create: (data) => api.post('/inventory', data),

  /**
   * Soft-delete an inventory record (sets status to INACTIVE).
   */
  delete: (id) => api.delete(`/inventory/${id}`),

  /**
   * Assign physical storage location to an inventory record.
   */
  assignStorage: (id, storageLocation) => api.put(`/inventory/${id}/storage`, null, { params: { storageLocation } }),

  /**
   * List inventory by storage location.
   */
  getByStorage: (location) => api.get(`/inventory/storage/${location}`),

  /**
   * Allocate sample quantity to an analyst.
   */
  allocate: (id, data) => api.post(`/inventory/${id}/allocate`, data),

  /**
   * Record consumed sample quantity.
   */
  consume: (id, data) => api.post(`/inventory/${id}/consume`, data),

  /**
   * Get variance reconciliation report (unconsumed items).
   */
  getVarianceReport: () => api.get('/inventory/variance'),

  /**
   * Generate barcode string (GET — uses default product name).
   */
  getBarcode: (id) => api.get(`/inventory/${id}/barcode`),

  /**
   * Generate barcode string with explicit product name.
   */
  generateBarcode: (id, data) => api.post(`/inventory/${id}/barcode`, data),
}
