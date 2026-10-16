import client from './client';

/**
 * Subcontracting API client (SRS Module 10).
 */

/** SC-01: Create a subcontract entry */
export const createSubcontract = (data) =>
  client.post('/subcontracts', data);

/** SC-02: List all subcontract entries */
export const listSubcontracts = () =>
  client.get('/subcontracts');

/** SC-03: Get subcontract detail */
export const getSubcontract = (id) =>
  client.get(`/subcontracts/${id}`);

/** SC-04: Update subcontract remarks/status */
export const updateSubcontract = (id, data) =>
  client.put(`/subcontracts/${id}`, data);

/** SC-05: Mark ROA as received */
export const markRoaReceived = (id) =>
  client.patch(`/subcontracts/${id}/roa-received`);

/**
 * Document Management API client (SRS Module 11).
 */

/** DM-01: Upload ROA */
export const uploadRoa = (executionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/documents/roa', formData, {
    params: { executionId },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DM-02: Upload COA */
export const uploadCoa = (arNumber, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/documents/coa', formData, {
    params: { arNumber },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DM-03: List documents for AR */
export const getDocuments = (arNumber) =>
  client.get(`/documents/${arNumber}`);

/** DM-04: Download document */
export const downloadDocument = (fileId) =>
  client.get(`/documents/download/${fileId}`, { responseType: 'blob' });
