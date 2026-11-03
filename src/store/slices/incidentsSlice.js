import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { incidentsApi } from '../../api/incidents'

export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { incidents } = getState()
      const { page, pageSize, filters } = incidents

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        incidentId: filters.incidentId || undefined,
        arNumber: filters.arNumber || undefined,
        productId: filters.productId || undefined,
        productName: filters.productName || undefined,
        paramName: filters.paramName || undefined,
        batchId: filters.batchId || undefined,
        analystId: filters.analystId || undefined,
      }

      const res = await incidentsApi.getIncidents(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const approveRetestThunk = createAsyncThunk(
  'incidents/approveRetest',
  async ({ incidentId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await incidentsApi.approveRetest(incidentId, reason)
      dispatch(fetchIncidents())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const rejectSampleThunk = createAsyncThunk(
  'incidents/rejectSample',
  async ({ incidentId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await incidentsApi.rejectSample(incidentId, reason)
      dispatch(fetchIncidents())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialFilters = {
  incidentId: '',
  arNumber: '',
  productId: '',
  productName: '',
  paramName: '',
  batchId: '',
  analystId: '',
  status: 'P', // default to PENDING
}

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    actionLoading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 0
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      state.filters[key] = value
      state.page = 0
    },
    clearFilters: (state) => {
      state.filters = { ...initialFilters }
      state.page = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch incidents'
      })
      .addMatcher(
        (action) => action.type.startsWith('incidents/') && action.type.endsWith('/pending') && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = true
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('incidents/') && (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = false
        }
      )
  },
})

export const { setPage, setPageSize, setFilter, clearFilters } = incidentsSlice.actions
export default incidentsSlice.reducer
