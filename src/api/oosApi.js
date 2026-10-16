import client from './client';

/**
 * OOS Incident Management API client (SRS Module 8 & 9).
 */

export const oosApi = {
  /** OIS-01: Authorize retest for an OOS incident */
  authorizeRetest: (id, data) =>
    client.post(`/v1/oos-incidents/${id}/authorize-retest`, data),

  /** OIS-02: Complete retest with revised result */
  completeRetest: (id, data) =>
    client.post(`/v1/oos-incidents/${id}/complete-retest`, data),

  /** OIS-03: Reject batch after investigation */
  rejectBatch: (id, data) =>
    client.post(`/v1/oos-incidents/${id}/reject-batch`, data),

  /** OIS-04: List OOS incidents with filters */
  listOosIncidents: (params = {}) =>
    client.get('/v1/oos-incidents', { params }),

  /** OIS-05: Get OOS incident detail */
  getOosIncident: (id) =>
    client.get(`/v1/oos-incidents/${id}`),

  /** OIS-06: List incidents by AR number */
  getOosIncidentsByAr: (arNumber) =>
    client.get(`/v1/oos-incidents/by-ar/${arNumber}`),

  /** TT-01: Mark AR as For_Information */
  markForInformation: (arNumber, reason) =>
    client.post(`/v1/trial-tests/${arNumber}/mark-for-information`, null, {
      params: { reason },
    }),

  /** TT-02: Generate fresh AR from For_Information AR */
  generateFreshAr: (arNumber) =>
    client.post(`/v1/trial-tests/${arNumber}/generate-fresh-ar`),

  /** TT-03: Get For_Information AR detail */
  getForInfoAr: (arNumber) =>
    client.get(`/v1/trial-tests/${arNumber}`),
};
