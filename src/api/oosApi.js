import client from './client';

/**
 * OOS Incident Management API client (SRS Module 8).
 */

/** OIS-01: Authorize retest for an OOS incident */
export const authorizeRetest = (id, data) =>
  client.post(`/oos-incidents/${id}/authorize-retest`, data);

/** OIS-02: Complete retest with revised result */
export const completeRetest = (id, data) =>
  client.post(`/oos-incidents/${id}/complete-retest`, data);

/** OIS-03: Reject batch after investigation */
export const rejectBatch = (id, data) =>
  client.post(`/oos-incidents/${id}/reject-batch`, data);

/** OIS-04: List OOS incidents with filters */
export const listOosIncidents = (params = {}) =>
  client.get('/oos-incidents', { params });

/** OIS-05: Get OOS incident detail */
export const getOosIncident = (id) =>
  client.get(`/oos-incidents/${id}`);

/** OIS-06: List incidents by AR number */
export const getOosIncidentsByAr = (arNumber) =>
  client.get(`/oos-incidents/by-ar/${arNumber}`);

/** TT-01: Mark AR as For_Information */
export const markForInformation = (arNumber, reason) =>
  client.post(`/trial-tests/${arNumber}/mark-for-information`, null, {
    params: { reason }
  });

/** TT-02: Generate fresh AR from For_Information AR */
export const generateFreshAr = (arNumber) =>
  client.post(`/trial-tests/${arNumber}/generate-fresh-ar`);

/** TT-03: Get For_Information AR detail */
export const getForInfoAr = (arNumber) =>
  client.get(`/trial-tests/${arNumber}`);
