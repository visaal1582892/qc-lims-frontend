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

  getSubmissionDetails: (detailId) => {
    return api.get(`/v1/assigned-tests/${detailId}/submission-details`)
  },

  getTestHistory: (detailId) => {
    return api.get(`/v1/assigned-tests/${detailId}/history`)
  },

  submitTestResults: (detailId, payload) => {
    return api.post(`/v1/assigned-tests/${detailId}/submit`, payload)
  },
}
