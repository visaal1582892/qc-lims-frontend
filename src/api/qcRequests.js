import api from './client'

const INWARD_API_KEY = 'qc-lims-inward-secure-key-2026'

export const qcRequestsApi = {
  // Ingest inward JSON payload
  submitInwardPayload: (payload, customApiKey) => {
    return api.post('/v1/qc-requests/inward-payload', payload, {
      headers: {
        'X-API-KEY': customApiKey ?? INWARD_API_KEY,
      },
      skipAuthRedirect: true,
    })
  },

  // Paginated query for QC testing requests
  getQcRequests: (params) => {
    return api.get('/v1/qc-requests', { params })
  },

  // Pre-validate requests for acceptance
  validateAcceptance: (requestIds) => {
    return api.post('/v1/qc-requests/validate-acceptance', { requestIds })
  },

  // Bulk accept requests and generate single Transfer Order
  bulkAcceptRequests: (requestIds) => {
    return api.post('/v1/qc-requests/bulk-accept', { requestIds })
  },

  // Bulk reject requests
  bulkRejectRequests: (requestIds) => {
    return api.post('/v1/qc-requests/bulk-reject', { requestIds })
  },

  // Fetch unique accepted TO IDs without AR number
  getUniqueToIds: () => {
    return api.get('/v1/qc-requests/unique-to-ids')
  },

  // Upload TRF file for a single request
  uploadTrf: (requestId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/v1/qc-requests/${requestId}/upload-trf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Mark TRF as needing revision with remarks
  reviseTrf: (requestId, remarks) => {
    return api.post(`/v1/qc-requests/${requestId}/revise-trf`, { remarks })
  },

  // Proxy download TRF file
  getProxyDownloadUrl: (fileUrl) => {
    return `/api/v1/qc-requests/proxy-download?url=${encodeURIComponent(fileUrl)}`
  },

  downloadProxyFile: (fileUrl) => {
    return api.get('/v1/qc-requests/proxy-download', {
      params: { url: fileUrl },
      responseType: 'blob',
    })
  },

  // Fetch nested Transfer Order details (header + items)
  getTransferOrderDetails: (toIds, status, statusNot) => {
    const params = {}
    if (toIds && toIds.length > 0) {
      params.toIds = toIds.join(',')
    }
    if (status) params.status = status
    if (statusNot) params.statusNot = statusNot
    return api.get('/v1/transfer-orders/details', { params })
  },

  // Fetch nested GRN details (header + items)
  getGrnDetails: (grnIds, status) => {
    const params = {}
    if (grnIds && grnIds.length > 0) {
      params.grnIds = grnIds.join(',')
    }
    if (status) params.status = status
    return api.get('/v1/grn-details', { params })
  },
}

export const arNumbersApi = {
  // Fetch next proposed AR sequence for current year
  getNextProposed: () => {
    return api.get('/v1/ar-numbers/next-sequence')
  },

  // Generate AR numbers for accepted requests
  generateArNumbers: (requestIds, customSequence) => {
    return api.post('/v1/ar-numbers/generate', {
      requestIds,
      customSequence: customSequence ? parseInt(customSequence, 10) : null,
    })
  },
}
