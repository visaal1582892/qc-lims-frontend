import api from './client'

export const assignedTestsApi = {
  getAssignedTests: (params) => {
    return api.get('/v1/assigned-tests', { params })
  },

  startTest: (detailId) => {
    return api.post(`/v1/assigned-tests/${detailId}/start`)
  },

  holdTest: (detailId, reason) => {
    return api.post(`/v1/assigned-tests/${detailId}/hold`, { reason })
  },

  unholdTest: (detailId) => {
    return api.post(`/v1/assigned-tests/${detailId}/unhold`)
  },

  cancelTest: (detailId, reason) => {
    return api.post(`/v1/assigned-tests/${detailId}/cancel`, { reason })
  },

  outsourceTest: (detailId, reason) => {
    return api.post(`/v1/assigned-tests/${detailId}/outsource`, { reason })
  },

  approveTest: (detailId) => {
    return api.post(`/v1/assigned-tests/${detailId}/approve`)
  },

  reworkTest: (detailId, reason) => {
    return api.post(`/v1/assigned-tests/${detailId}/rework`, { reason })
  },

  // Transfer
  transferTest: (detailId, payload) => {
    return api.post(`/v1/assigned-tests/${detailId}/transfer`, payload)
  },

  getEligibleUsers: (paramId, excludeUserId) => {
    const params = { paramId }
    if (excludeUserId) params.excludeUserId = excludeUserId
    return api.get('/v1/assigned-tests/eligible-users', { params })
  },

  getSubmissionDetails: (detailId) => {
    return api.get(`/v1/assigned-tests/${detailId}/submission-details`)
  },

  getViewTestDetail: (detailId) => {
    return api.get(`/v1/assigned-tests/view/${detailId}`)
  },

  getTestHistory: (detailId) => {
    return api.get(`/v1/assigned-tests/${detailId}/history`)
  },

  submitTestResults: (detailId, payload) => {
    return api.post(`/v1/assigned-tests/${detailId}/submit`, payload)
  },

  // Files
  getFilesForDetail: (detailId) => {
    return api.get(`/v1/assigned-tests/${detailId}/files`)
  },

  getPreviousAttemptFiles: (detailId, execId) => {
    return api.get(`/v1/assigned-tests/${detailId}/previous-attempt-files`, {
      params: { execId },
    })
  },

  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/v1/assigned-tests/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
