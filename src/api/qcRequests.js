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

  // Mark TRF as needing revision with remarks (Generate AR)
  reviseTrf: (requestId, remarks) => {
    return api.post(`/v1/qc-requests/${requestId}/revise-trf`, { remarks })
  },

  // Proxy download TRF file
  getProxyDownloadUrl: (fileUrl) => {
    return `/api/v1/qc-requests/proxy-download?url=${encodeURIComponent(fileUrl)}`
  },

  downloadProxyFile: (fileUrl, filename) => {
    return api.get('/v1/qc-requests/proxy-download', {
      params: { url: fileUrl, filename },
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

  // Fetch GRN batches with inventory for manual QC request creation
  getGrnBatchesWithInventory: (grnId) => {
    return api.get('/v1/grn-details/with-inventory', { params: { grnId } })
  },

  // Manual create QC requests
  manualCreateQcRequests: (payload) => {
    return api.post('/v1/qc-requests/manual-create', payload)
  },

  // Paginated query for GRN failures
  getGrnFailures: (params) => {
    return api.get('/v1/grn-failures', { params })
  },
}

export const eTrfApi = {
  // Get prefill data for E-TRF
  getPrefill: (requestId) => {
    return api.get(`/v1/e-trf/${requestId}/prefill`)
  },

  // Upload optional TRF document to CDN (returns { url, thumbnailUrl, originalName } without DB write)
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/v1/e-trf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Save E-TRF form details (transitions status to PENDING_APPROVAL)
  saveDetails: (requestId, payload) => {
    return api.post(`/v1/e-trf/${requestId}`, payload)
  },

  // Get saved E-TRF form details
  getDetails: (requestId) => {
    return api.get(`/v1/e-trf/${requestId}`)
  },

  // Approve a PENDING_APPROVAL TRF request
  approveTrf: (requestId) => {
    return api.post(`/v1/e-trf/${requestId}/approve`)
  },

  // Flag a PENDING_APPROVAL TRF request as NEEDS_REVISION with remarks
  reviseTrf: (requestId, remarks) => {
    return api.post(`/v1/e-trf/${requestId}/revise`, { remarks })
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
