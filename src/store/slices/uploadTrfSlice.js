import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi } from '../../api/qcRequests'

export const fetchUploadTrfRequests = createAsyncThunk(
  'uploadTrf/fetchRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { uploadTrf } = getState()
      const { page, pageSize, filters } = uploadTrf

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: 'A',
        arNumber: 'null',
        trfPendingUpload: true,
        trfStatus: filters.trfStatus || undefined,
        requestId: filters.requestId || undefined,
        toId: filters.toId || undefined,
        grnId: filters.grnId || undefined,
        fromStoreId: filters.storeId || undefined,
        productId: filters.productId || undefined,
        batchId: filters.batchId || undefined,
      }

      const res = await qcRequestsApi.getQcRequests(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const uploadTrfThunk = createAsyncThunk(
  'uploadTrf/upload',
  async ({ requestId, file }, { dispatch, rejectWithValue }) => {
    try {
      const res = await qcRequestsApi.uploadTrf(requestId, file)
      dispatch(fetchUploadTrfRequests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialFilters = {
  requestId: '',
  toId: '',
  grnId: '',
  storeId: '',
  productId: '',
  batchId: '',
  trfStatus: '',
}

const uploadTrfSlice = createSlice({
  name: 'uploadTrf',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
    // Modal state
    uploadModalOpen: false,
    selectedRequestForUpload: null,
    uploading: false,
    uploadError: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
      state.page = 0
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters }
      state.page = 0
    },
    openUploadModal: (state, action) => {
      state.selectedRequestForUpload = action.payload
      state.uploadModalOpen = true
      state.uploadError = null
      state.uploading = false
    },
    closeUploadModal: (state) => {
      state.uploadModalOpen = false
      state.selectedRequestForUpload = null
      state.uploadError = null
      state.uploading = false
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUploadTrfRequests
      .addCase(fetchUploadTrfRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUploadTrfRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
      })
      .addCase(fetchUploadTrfRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // uploadTrfThunk
      .addCase(uploadTrfThunk.pending, (state) => {
        state.uploading = true
        state.uploadError = null
      })
      .addCase(uploadTrfThunk.fulfilled, (state) => {
        state.uploading = false
        state.uploadModalOpen = false
        state.selectedRequestForUpload = null
        state.uploadError = null
      })
      .addCase(uploadTrfThunk.rejected, (state, action) => {
        state.uploading = false
        state.uploadError = action.payload
      })
  },
})

export const {
  setPage,
  setFilter,
  resetFilters,
  openUploadModal,
  closeUploadModal,
} = uploadTrfSlice.actions

export default uploadTrfSlice.reducer
