import api from './client'

/**
 * API module for external TOS (Test Order Specification) hooks.
 *
 * These endpoints are consumed by external warehouse/ERP systems.
 * No UI pages currently use these; they are provided for completeness
 * and future frontend integration (e.g., Dashboard polling).
 *
 * Endpoints:
 * - POST /api/v1/external/tos-trigger  — Submit new GRN/Transfer Order
 * - POST /api/v1/external/tos-update   — Submit TOS status update callback
 */
export const externalApi = {
  /**
   * Trigger a new TOS (Test Order Specification).
   * @param {Object} data - GRN/Transfer Order payload
   * @returns {Promise} 202 ACCEPTED with acknowledgment
   */
  triggerTOS(data) {
    return api.post('/v1/external/tos-trigger', data)
  },

  /**
   * Submit a TOS status update callback.
   * @param {Object} data - TOS update payload (grnNumber or trfId, status)
   * @returns {Promise} 200 OK with acknowledgment
   */
  updateTOS(data) {
    return api.post('/v1/external/tos-update', data)
  },
}

export default externalApi
