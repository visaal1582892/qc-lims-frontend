import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi } from '../../api/qcRequests'

export const fetchQcRequests = createAsyncThunk(
  'qcRequests/fetchRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { qcRequests } = getState()
      const { page, pageSize, filters } = qcRequests

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: 'P',
        requestId: filters.requestId || undefined,
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

export const validateAcceptanceThunk = createAsyncThunk(
  'qcRequests/validateAcceptance',
  async (requestIds, { rejectWithValue }) => {
    try {
      const res = await qcRequestsApi.validateAcceptance(requestIds)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const bulkAcceptThunk = createAsyncThunk(
  'qcRequests/bulkAccept',
  async (requestIds, { dispatch, rejectWithValue }) => {
    try {
      const res = await qcRequestsApi.bulkAcceptRequests(requestIds)
      dispatch(fetchQcRequests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const bulkRejectThunk = createAsyncThunk(
  'qcRequests/bulkReject',
  async (requestIds, { dispatch, rejectWithValue }) => {
    try {
      const res = await qcRequestsApi.bulkRejectRequests(requestIds)
      dispatch(fetchQcRequests())
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
  status: 'P',
}

const qcRequestsSlice = createSlice({
  name: 'qcRequests',
  initialState: {
    items: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
    page: 0,
    pageSize: 20,
    filters: { ...initialFilters },
    selectedIds: [],
    // Modals & action states
    validationLoading: false,
    actionLoading: false,
    acceptModalOpen: false,
    rejectModalOpen: false,
    missingConfigModalOpen: false,
    storeMismatchModalOpen: false,
    mismatchStores: [],
    missingProducts: [],
    validationData: null,
    acceptError: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload
      if (key !== 'status') {
        state.filters[key] = value
        state.page = 0
      }
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters, status: 'P' }
      state.page = 0
    },
    clearFilters: (state) => {
      state.filters = { ...initialFilters, status: 'P' }
      state.page = 0
    },
    toggleSelectRow: (state, action) => {
      const id = action.payload
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter(i => i !== id)
      } else {
        state.selectedIds.push(id)
      }
    },
    toggleSelectAllOnPage: (state) => {
      const pageIds = state.items.map(i => i.requestId)
      const allSelected = pageIds.length > 0 && pageIds.every(id => state.selectedIds.includes(id))
      if (allSelected) {
        state.selectedIds = state.selectedIds.filter(id => !pageIds.includes(id))
      } else {
        state.selectedIds = Array.from(new Set([...state.selectedIds, ...pageIds]))
      }
    },
    clearSelection: (state) => {
      state.selectedIds = []
    },
    setAcceptModalOpen: (state, action) => {
      state.acceptModalOpen = action.payload
      if (!action.payload) {
        state.acceptError = null
      }
    },
    setRejectModalOpen: (state, action) => {
      state.rejectModalOpen = action.payload
    },
    setMissingConfigModalOpen: (state, action) => {
      state.missingConfigModalOpen = action.payload
    },
    setStoreMismatchModalOpen: (state, action) => {
      state.storeMismatchModalOpen = action.payload
    },
    setValidationData: (state, action) => {
      state.validationData = action.payload
    },
    setMismatchStores: (state, action) => {
      state.mismatchStores = action.payload
    },
    setMissingProducts: (state, action) => {
      state.missingProducts = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchQcRequests
      .addCase(fetchQcRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQcRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
      })
      .addCase(fetchQcRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // validateAcceptanceThunk
      .addCase(validateAcceptanceThunk.pending, (state) => {
        state.validationLoading = true
      })
      .addCase(validateAcceptanceThunk.fulfilled, (state, action) => {
        state.validationLoading = false
        const data = action.payload
        state.validationData = data
        if (data && !data.valid) {
          if (data.mismatchStores && data.mismatchStores.length > 0) {
            state.mismatchStores = data.mismatchStores
            state.storeMismatchModalOpen = true
          } else if (data.hasMissingConfig || (data.missingProductIds && data.missingProductIds.length > 0) || (data.missingConfigProducts && data.missingConfigProducts.length > 0)) {
            state.missingProducts = data.missingProductIds || data.missingConfigProducts || []
            state.missingConfigModalOpen = true
          }
        } else if (data && data.valid) {
          state.acceptModalOpen = true
        }
      })
      .addCase(validateAcceptanceThunk.rejected, (state) => {
        state.validationLoading = false
      })
      // bulkAcceptThunk
      .addCase(bulkAcceptThunk.pending, (state) => {
        state.actionLoading = true
        state.acceptError = null
      })
      .addCase(bulkAcceptThunk.fulfilled, (state) => {
        state.actionLoading = false
        state.acceptModalOpen = false
        state.selectedIds = []
        state.acceptError = null
      })
      .addCase(bulkAcceptThunk.rejected, (state, action) => {
        state.actionLoading = false
        state.acceptError = action.payload || 'Failed to accept requests and create Transfer Order'
      })
      // bulkRejectThunk
      .addCase(bulkRejectThunk.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(bulkRejectThunk.fulfilled, (state) => {
        state.actionLoading = false
        state.rejectModalOpen = false
        state.selectedIds = []
      })
      .addCase(bulkRejectThunk.rejected, (state) => {
        state.actionLoading = false
      })
  },
})

export const {
  setPage,
  setFilter,
  resetFilters,
  clearFilters,
  toggleSelectRow,
  toggleSelectAllOnPage,
  clearSelection,
  setAcceptModalOpen,
  setRejectModalOpen,
  setMissingConfigModalOpen,
  setStoreMismatchModalOpen,
  setValidationData,
  setMismatchStores,
  setMissingProducts,
} = qcRequestsSlice.actions

export default qcRequestsSlice.reducer
