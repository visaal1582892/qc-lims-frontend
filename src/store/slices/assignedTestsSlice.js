import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { assignedTestsApi } from '../../api/assignedTests'

export const fetchAssignedTests = createAsyncThunk(
  'assignedTests/fetchAssignedTests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { assignedTests } = getState()
      const { page, pageSize, filters } = assignedTests

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        arNumber: filters.arNumber || undefined,
        productId: filters.productId || undefined,
        productName: filters.productName || undefined,
        paramName: filters.paramName || undefined,
        batchId: filters.batchId || undefined,
        batch: filters.batch || undefined,
        userId: filters.userId || undefined,
      }

      const res = await assignedTestsApi.getAssignedTests(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const startTestThunk = createAsyncThunk(
  'assignedTests/startTest',
  async (detailId, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.startTest(detailId)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const holdTestThunk = createAsyncThunk(
  'assignedTests/holdTest',
  async ({ detailId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.holdTest(detailId, reason)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const unholdTestThunk = createAsyncThunk(
  'assignedTests/unholdTest',
  async (detailId, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.unholdTest(detailId)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const cancelTestThunk = createAsyncThunk(
  'assignedTests/cancelTest',
  async ({ detailId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.cancelTest(detailId, reason)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const outsourceTestThunk = createAsyncThunk(
  'assignedTests/outsourceTest',
  async ({ detailId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.outsourceTest(detailId, reason)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const approveTestThunk = createAsyncThunk(
  'assignedTests/approveTest',
  async (detailId, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.approveTest(detailId)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const reworkTestThunk = createAsyncThunk(
  'assignedTests/reworkTest',
  async ({ detailId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.reworkTest(detailId, reason)
      dispatch(fetchAssignedTests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialFilters = {
  arNumber: '',
  productId: '',
  productName: '',
  paramName: '',
  batchId: '',
  batch: '',
  userId: '',
  status: 'all',
}

const assignedTestsSlice = createSlice({
  name: 'assignedTests',
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
      .addCase(fetchAssignedTests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssignedTests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
      })
      .addCase(fetchAssignedTests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch assigned tests'
      })
      // Action states
      .addMatcher(
        (action) => action.type.startsWith('assignedTests/') && action.type.endsWith('/pending') && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = true
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('assignedTests/') && (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) && !action.type.includes('fetch'),
        (state) => {
          state.actionLoading = false
        }
      )
  },
})

export const { setPage, setPageSize, setFilter, clearFilters } = assignedTestsSlice.actions
export default assignedTestsSlice.reducer
