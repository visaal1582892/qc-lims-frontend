import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi } from '../../api/qcRequests'

export const fetchGrnFailures = createAsyncThunk(
  'grnFailures/fetchFailures',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { grnFailures } = getState()
      const { page, pageSize, filters } = grnFailures

      const params = {
        page,
        size: pageSize,
        sort: 'createdAt,desc',
        status: filters.status || undefined,
        requestReferenceNo: filters.requestReferenceNo || undefined,
        grnId: filters.grnId || undefined,
        fromStoreId: filters.fromStoreId || undefined,
        toStoreId: filters.toStoreId || undefined,
      }

      const res = await qcRequestsApi.getGrnFailures(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialFilters = {
  requestReferenceNo: '',
  grnId: '',
  fromStoreId: '',
  toStoreId: '',
  status: 'FAILED',
}

const grnFailuresSlice = createSlice({
  name: 'grnFailures',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
    // JSON viewer modal
    jsonModalOpen: false,
    jsonModalTitle: '',
    jsonModalContent: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 0
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters }
      state.page = 0
    },
    openJsonModal: (state, action) => {
      state.jsonModalOpen = true
      state.jsonModalTitle = action.payload.title
      state.jsonModalContent = action.payload.content
    },
    closeJsonModal: (state) => {
      state.jsonModalOpen = false
      state.jsonModalTitle = ''
      state.jsonModalContent = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrnFailures.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGrnFailures.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload?.content || []
        state.total = action.payload?.totalElements || 0
        state.totalPages = action.payload?.totalPages || 0
      })
      .addCase(fetchGrnFailures.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch GRN failures'
      })
  },
})

export const {
  setPage,
  setPageSize,
  setFilters,
  resetFilters,
  openJsonModal,
  closeJsonModal,
} = grnFailuresSlice.actions

export default grnFailuresSlice.reducer

