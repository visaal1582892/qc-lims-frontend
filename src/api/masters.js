import api from './client'

/** Upload helpers — send file as blob response so error Excel files pass through. */
function uploadEndpoint(path) {
  return (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    })
  }
}

export const mastersApi = {
    // Metric Unit
    getMetricUnits: (params = {}) => api.get('/masters/metric-units', { params }),
    uploadMetricUnits: uploadEndpoint('/masters/metric-units/upload'),
    downloadMetricUnitTemplate: () =>
        api.get('/masters/metric-units/template', { responseType: 'blob' }),

    // Test Parameter
    getTestParameters: (params = {}) => api.get('/masters/test-parameters', { params }),
    uploadTestParameters: uploadEndpoint('/masters/test-parameters/upload'),
    downloadTestParameterTemplate: () =>
        api.get('/masters/test-parameters/template', { responseType: 'blob' }),

    // Analyst Qualification
    getAnalystQualifications: (params = {}) => api.get('/masters/analyst-qualifications', { params }),
    uploadAnalystQualifications: uploadEndpoint('/masters/analyst-qualifications/upload'),
    downloadAnalystQualificationTemplate: () =>
        api.get('/masters/analyst-qualifications/template', { responseType: 'blob' }),

    // Inventory Configuration
    getInventoryConfig: (params = {}) => api.get('/masters/inventory-config', { params }),
    uploadInventoryConfig: uploadEndpoint('/masters/inventory-config/upload'),
    downloadInventoryConfigTemplate: () =>
        api.get('/masters/inventory-config/template', { responseType: 'blob' }),
}
