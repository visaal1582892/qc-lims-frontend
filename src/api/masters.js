import api from './client'

export const mastersApi = {
    // Metric Unit
    getMetricUnits: (params = {}) => api.get('/masters/metric-units', { params }),
    uploadMetricUnits: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/metric-units', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadMetricUnitTemplate: () =>
        api.get('/masters/metric-units/template', { responseType: 'blob' }),

    // Test Parameter
    getTestParameters: (params = {}) => api.get('/masters/test-parameters', { params }),
    uploadTestParameters: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/masters/test-parameters', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    downloadTestParameterTemplate: () =>
        api.get('/masters/test-parameters/template', { responseType: 'blob' }),
}
