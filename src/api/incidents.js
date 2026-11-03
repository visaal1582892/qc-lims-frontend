import api from './client'

export const incidentsApi = {
  getIncidents: (params) => {
    return api.get('/v1/incidents', { params })
  },

  approveRetest: (incidentId, reason) => {
    return api.post(`/v1/incidents/${incidentId}/approve-retest`, { reason })
  },

  rejectSample: (incidentId, reason) => {
    return api.post(`/v1/incidents/${incidentId}/reject-sample`, { reason })
  },
}
