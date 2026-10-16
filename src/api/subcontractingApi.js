import client from './client';

/**
 * Subcontracting API client (SRS Module 10).
 */

/** SC-01: Create a subcontract entry */
export const createSubcontract = (data) =>
  client.post('/v1/subcontracts', data);

/** SC-02: List all subcontract entries */
export const listSubcontracts = () =>
  client.get('/v1/subcontracts');

/** SC-03: Get subcontract detail */
export const getSubcontract = (id) =>
  client.get(`/v1/subcontracts/${id}`);

/** SC-04: Update subcontract remarks/status */
export const updateSubcontract = (id, data) =>
  client.put(`/v1/subcontracts/${id}`, data);

/** SC-05: Mark ROA as received */
export const markRoaReceived = (id) =>
  client.patch(`/v1/subcontracts/${id}/roa-received`);

/**
 * Document Management API client (SRS Module 11).
 */

/** DM-01: Upload ROA */
export const uploadRoa = (executionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/v1/documents/roa', formData, {
    params: { executionId },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DM-02: Upload COA */
export const uploadCoa = (arNumber, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/v1/documents/coa', formData, {
    params: { arNumber },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DM-03: List documents for AR */
export const getDocuments = (arNumber) =>
  client.get(`/v1/documents/${arNumber}`);

/** DM-06: List all documents */
export const listDocuments = () =>
  client.get('/v1/documents/all');

/** DM-04: Download document */
export const downloadDocument = (fileId) =>
  client.get(`/v1/documents/download/${fileId}`, { responseType: 'blob' });
