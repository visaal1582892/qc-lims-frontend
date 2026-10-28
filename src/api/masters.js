import api from './client'

export const mastersApi = {
    // Metrics
    getMetrics: (params = {}) => api.get('/masters/metrics', { params }),
    uploadMetrics: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/metrics/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadMetricTemplate: () =>
        api.get('/masters/metrics/template', { responseType: 'blob' }),

    // Metric Unit aliases (backward compatibility)
    getMetricUnits: (params = {}) => api.get('/masters/metrics', { params }),
    uploadMetricUnits: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/metrics/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadMetricUnitTemplate: () =>
        api.get('/masters/metrics/template', { responseType: 'blob' }),

    // Test Parameter
    getTestParameters: (params = {}) => api.get('/masters/test-parameters', { params }),
    uploadTestParameters: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/test-parameters/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadTestParameterTemplate: () =>
        api.get('/masters/test-parameters/template', { responseType: 'blob' }),

    // Analyst Qualification
    getAnalystQualifications: (params = {}) => api.get('/masters/analyst-qualifications', { params }),
    uploadAnalystQualifications: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/analyst-qualifications/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadAnalystQualificationTemplate: () =>
        api.get('/masters/analyst-qualifications/template', { responseType: 'blob' }),

    // Inventory Configuration
    getInventoryConfig: (params = {}) => api.get('/masters/inventory-config', { params }),
    uploadInventoryConfig: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/inventory-config/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadInventoryConfigTemplate: () =>
        api.get('/masters/inventory-config/template', { responseType: 'blob' }),

    // Metric Specifications
    getMetricSpecifications: (params = {}) => api.get('/masters/metric-specifications', { params }),
    uploadMetricSpecifications: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/metric-specifications/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadMetricSpecificationTemplate: () =>
        api.get('/masters/metric-specifications/template', { responseType: 'blob' }),
}
