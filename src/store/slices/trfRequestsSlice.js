import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi, eTrfApi } from '../../api/qcRequests'

export const fetchTrfRequests = createAsyncThunk(
  'trfRequests/fetchRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { trfRequests } = getState()
      const { page, pageSize, filters } = trfRequests

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: 'A',
        trfStatus: filters.trfStatus && filters.trfStatus !== 'all' ? filters.trfStatus : undefined,
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

export const approveTrfThunk = createAsyncThunk(
  'trfRequests/approveTrf',
  async ({ requestId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await eTrfApi.approveTrf(requestId)
      dispatch(fetchTrfRequests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const reviseTrfRequestThunk = createAsyncThunk(
  'trfRequests/reviseTrf',
  async ({ requestId, remarks }, { dispatch, rejectWithValue }) => {
    try {
      const res = await eTrfApi.reviseTrf(requestId, remarks)
      dispatch(fetchTrfRequests())
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
  trfStatus: 'all',
}

const trfRequestsSlice = createSlice({
  name: 'trfRequests',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
    actionLoading: false,
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
  },
  extraReducers: (builder) => {
    builder
      // fetchTrfRequests
      .addCase(fetchTrfRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTrfRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
      })
      .addCase(fetchTrfRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // approveTrfThunk
      .addCase(approveTrfThunk.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(approveTrfThunk.fulfilled, (state) => {
        state.actionLoading = false
      })
      .addCase(approveTrfThunk.rejected, (state) => {
        state.actionLoading = false
      })
      // reviseTrfRequestThunk
      .addCase(reviseTrfRequestThunk.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(reviseTrfRequestThunk.fulfilled, (state) => {
        state.actionLoading = false
      })
      .addCase(reviseTrfRequestThunk.rejected, (state) => {
        state.actionLoading = false
      })
  },
})

export const {
  setPage,
  setFilter,
  resetFilters,
} = trfRequestsSlice.actions

export default trfRequestsSlice.reducer

