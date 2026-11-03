import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { qcRequestsApi, arNumbersApi } from '../../api/qcRequests'

export const fetchGenerateArRequests = createAsyncThunk(
  'generateAr/fetchRequests',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { generateAr } = getState()
      const { page, pageSize, filters } = generateAr

      const params = {
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
        status: 'A',
        arNumber: 'null',
        trfUrl: 'notnull',
        trfStatus: 'U',
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

export const fetchNextProposedAr = createAsyncThunk(
  'generateAr/fetchNextProposed',
  async (_, { rejectWithValue }) => {
    try {
      const res = await arNumbersApi.getNextProposed()
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const generateArNumbersThunk = createAsyncThunk(
  'generateAr/generateNumbers',
  async ({ requestIds, customSequence }, { dispatch, rejectWithValue }) => {
    try {
      const res = await arNumbersApi.generateArNumbers(requestIds, customSequence)
      dispatch(fetchGenerateArRequests())
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const reviseTrfThunk = createAsyncThunk(
  'generateAr/reviseTrf',
  async ({ requestId, remarks }, { dispatch, rejectWithValue }) => {
    try {
      const res = await qcRequestsApi.reviseTrf(requestId, remarks)
      dispatch(fetchGenerateArRequests())
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
}

const generateArSlice = createSlice({
  name: 'generateAr',
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
    // Generate AR modal
    modalOpen: false,
    targetIds: [],
    proposedAr: '',
    yearPrefix: 'MHSL26',
    serialInput: '0001',
    modalLoading: false,
    actionLoading: false,
    // Revise TRF modal
    reviseModalOpen: false,
    selectedRequestForRevise: null,
    reviseRemarks: '',
    reviseLoading: false,
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
    openArModal: (state, action) => {
      state.targetIds = action.payload
      state.modalOpen = true
      state.modalLoading = true
    },
    closeArModal: (state) => {
      state.modalOpen = false
      state.targetIds = []
      state.modalLoading = false
    },
    setSerialInput: (state, action) => {
      state.serialInput = action.payload
    },
    openReviseModal: (state, action) => {
      state.selectedRequestForRevise = action.payload
      state.reviseRemarks = ''
      state.reviseModalOpen = true
    },
    closeReviseModal: (state) => {
      state.reviseModalOpen = false
      state.selectedRequestForRevise = null
      state.reviseRemarks = ''
    },
    setReviseRemarks: (state, action) => {
      state.reviseRemarks = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGenerateArRequests
      .addCase(fetchGenerateArRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGenerateArRequests.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.items = payload.content || []
        state.totalPages = payload.totalPages ?? payload.page?.totalPages ?? 0
        state.total = payload.totalElements ?? payload.page?.totalElements ?? 0
      })
      .addCase(fetchGenerateArRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // fetchNextProposedAr
      .addCase(fetchNextProposedAr.pending, (state) => {
        state.modalLoading = true
      })
      .addCase(fetchNextProposedAr.fulfilled, (state, action) => {
        state.modalLoading = false
        const proposed = action.payload?.nextProposedArNumber || 'MHSL260001'
        state.proposedAr = proposed
        const prefix = proposed.substring(0, 6)
        const serial = proposed.substring(6)
        state.yearPrefix = prefix
        state.serialInput = serial
      })
      .addCase(fetchNextProposedAr.rejected, (state) => {
        state.modalLoading = false
      })
      // generateArNumbersThunk
      .addCase(generateArNumbersThunk.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(generateArNumbersThunk.fulfilled, (state) => {
        state.actionLoading = false
        state.modalOpen = false
        state.selectedIds = []
      })
      .addCase(generateArNumbersThunk.rejected, (state) => {
        state.actionLoading = false
      })
      // reviseTrfThunk
      .addCase(reviseTrfThunk.pending, (state) => {
        state.reviseLoading = true
      })
      .addCase(reviseTrfThunk.fulfilled, (state, action) => {
        state.reviseLoading = false
        state.reviseModalOpen = false
        state.selectedRequestForRevise = null
        state.reviseRemarks = ''
        // remove revised request from selectedIds if selected
        if (action.meta?.arg?.requestId) {
          state.selectedIds = state.selectedIds.filter(id => id !== action.meta.arg.requestId)
        }
      })
      .addCase(reviseTrfThunk.rejected, (state) => {
        state.reviseLoading = false
      })
  },
})

export const {
  setPage,
  setFilter,
  resetFilters,
  toggleSelectRow,
  toggleSelectAllOnPage,
  clearSelection,
  openArModal,
  closeArModal,
  setSerialInput,
  openReviseModal,
  closeReviseModal,
  setReviseRemarks,
} = generateArSlice.actions

export default generateArSlice.reducer
