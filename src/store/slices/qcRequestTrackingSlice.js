import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi } from '../../api/qcRequests'

export const fetchTrackingRequests = createAsyncThunk(
  'qcRequestTracking/fetchTrackingRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { qcRequestTracking } = getState()
      const { page, pageSize, filters } = qcRequestTracking

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        requestId: filters.requestId || undefined,
        grnId: filters.grnId || undefined,
        fromStoreId: filters.storeId || undefined,
        productId: filters.productId || undefined,
        batchId: filters.batchId || undefined,
        toId: filters.toId || undefined,
        arNumber: filters.arNumber || undefined,
        trfStatus: filters.trfStatus && filters.trfStatus !== 'all' ? filters.trfStatus : undefined,
        trfRemarks: filters.trfRemarks || undefined,
        createdBy: filters.createdBy || undefined,
        updatedBy: filters.updatedBy || undefined,
      }

      const res = await qcRequestsApi.getQcRequests(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialFilters = {
  requestId: '',
  grnId: '',
  storeId: '',
  productId: '',
  batchId: '',
  toId: '',
  arNumber: '',
  trfStatus: 'all',
  trfRemarks: '',
  status: 'all',
  createdBy: '',
  updatedBy: '',
}

const qcRequestTrackingSlice = createSlice({
  name: 'qcRequestTracking',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
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
    clearFilters: (state) => {
      state.filters = { ...initialFilters }
      state.page = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackingRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTrackingRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
      })
      .addCase(fetchTrackingRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  setPage,
  setFilter,
  resetFilters,
  clearFilters,
} = qcRequestTrackingSlice.actions

export default qcRequestTrackingSlice.reducer
