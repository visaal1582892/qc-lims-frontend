import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { assignedTestsApi } from '../../api/assignedTests'

// ========================================================================
// Async Thunks
// ========================================================================

export const fetchSubmissionDetailsThunk = createAsyncThunk(
  'testExecution/fetchSubmissionDetails',
  async (detailId, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getSubmissionDetails(detailId)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchPreviousAttemptFilesThunk = createAsyncThunk(
  'testExecution/fetchPreviousAttemptFiles',
  async ({ detailId, execId }, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getPreviousAttemptFiles(detailId, execId)
      return res.data || []
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const uploadEvidenceFileThunk = createAsyncThunk(
  'testExecution/uploadEvidenceFile',
  async (file, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.uploadFile(file)
      return {
        url: res.data?.url || res.url,
        originalName: file.name,
        remarks: '',
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || `Failed to upload: ${file.name}`)
    }
  }
)

export const submitTestResultsThunk = createAsyncThunk(
  'testExecution/submitTestResults',
  async ({ detailId, payload }, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.submitTestResults(detailId, payload)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchViewTestDetailThunk = createAsyncThunk(
  'testExecution/fetchViewTestDetail',
  async (detailId, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getViewTestDetail(detailId)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchViewFilesThunk = createAsyncThunk(
  'testExecution/fetchViewFiles',
  async (detailId, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getFilesForDetail(detailId)
      return res.data || []
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchEligibleUsersThunk = createAsyncThunk(
  'testExecution/fetchEligibleUsers',
  async ({ paramId, excludeUserId }, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getEligibleUsers(paramId, excludeUserId)
      return res.data || []
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const transferTestThunk = createAsyncThunk(
  'testExecution/transferTest',
  async ({ detailId, targetUserId, reason }, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.transferTest(detailId, { targetUserId, reason })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchTestHistoryThunk = createAsyncThunk(
  'testExecution/fetchTestHistory',
  async (detailId, { rejectWithValue }) => {
    try {
      const res = await assignedTestsApi.getTestHistory(detailId)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// ========================================================================
// Initial States
// ========================================================================

const initialSubmissionState = {
  detailId: null,
  testDetails: null,
  metricValues: {},
  uploadedFiles: [],
  previousAttemptFiles: [],
  selectedPreviousFileIds: [],
  linkedFileRemarks: {},
  loading: false,
  loadingPreviousFiles: false,
  uploadingFile: false,
  submitting: false,
  error: null,
  submitSuccess: false,
}

const initialViewState = {
  detailId: null,
  testDetails: null,
  files: [],
  loading: false,
  loadingFiles: false,
  error: null,
}

const initialTransferState = {
  isOpen: false,
  item: null,
  eligibleUsers: [],
  selectedUserId: '',
  reason: '',
  loadingUsers: false,
  submitting: false,
  error: null,
  transferSuccess: false,
}

const initialHistoryState = {
  isOpen: false,
  detailId: null,
  historyData: null,
  loading: false,
  error: null,
}

// ========================================================================
// Slice
// ========================================================================

const testExecutionSlice = createSlice({
  name: 'testExecution',
  initialState: {
    submission: { ...initialSubmissionState },
    view: { ...initialViewState },
    transfer: { ...initialTransferState },
    history: { ...initialHistoryState },
  },
  reducers: {
    // Submission reducers
    setMetricValue: (state, action) => {
      const { specId, value } = action.payload
      state.submission.metricValues[specId] = value
    },
    setAllMetricValues: (state, action) => {
      state.submission.metricValues = action.payload
    },
    addUploadedFiles: (state, action) => {
      state.submission.uploadedFiles.push(...action.payload)
    },
    updateFileRemarks: (state, action) => {
      const { index, remarks } = action.payload
      if (state.submission.uploadedFiles[index]) {
        state.submission.uploadedFiles[index].remarks = remarks
      }
    },
    removeUploadedFile: (state, action) => {
      const index = action.payload
      state.submission.uploadedFiles.splice(index, 1)
    },
    togglePreviousFileId: (state, action) => {
      const fileId = action.payload
      const ids = state.submission.selectedPreviousFileIds
      if (ids.includes(fileId)) {
        state.submission.selectedPreviousFileIds = ids.filter((id) => id !== fileId)
        delete state.submission.linkedFileRemarks[fileId]
      } else {
        ids.push(fileId)
        if (state.submission.linkedFileRemarks[fileId] === undefined) {
          const prev = state.submission.previousAttemptFiles.find((f) => f.fileId === fileId)
          state.submission.linkedFileRemarks[fileId] = prev?.remarks || ''
        }
      }
    },
    setLinkedFileRemark: (state, action) => {
      const { fileId, remarks } = action.payload
      state.submission.linkedFileRemarks[fileId] = remarks
    },
    clearSubmissionState: (state) => {
      state.submission = { ...initialSubmissionState }
    },

    // View reducers
    clearViewState: (state) => {
      state.view = { ...initialViewState }
    },

    // Transfer modal reducers
    openTransferModal: (state, action) => {
      state.transfer = {
        ...initialTransferState,
        isOpen: true,
        item: action.payload,
      }
    },
    closeTransferModal: (state) => {
      state.transfer = { ...initialTransferState }
    },
    setSelectedUserId: (state, action) => {
      state.transfer.selectedUserId = action.payload
    },
    setTransferReason: (state, action) => {
      state.transfer.reason = action.payload
    },
    resetTransferModal: (state) => {
      state.transfer = { ...initialTransferState }
    },

    // History modal reducers
    openHistoryModal: (state, action) => {
      state.history = {
        ...initialHistoryState,
        isOpen: true,
        detailId: action.payload,
      }
    },
    closeHistoryModal: (state) => {
      state.history = { ...initialHistoryState }
    },
  },
  extraReducers: (builder) => {
    builder
      // Submission Details
      .addCase(fetchSubmissionDetailsThunk.pending, (state) => {
        state.submission.loading = true
        state.submission.error = null
        state.submission.submitSuccess = false
      })
      .addCase(fetchSubmissionDetailsThunk.fulfilled, (state, action) => {
        state.submission.loading = false
        state.submission.testDetails = action.payload
        state.submission.detailId = action.payload?.detailId

        const initialVals = {}
        if (action.payload?.specifications) {
          action.payload.specifications.forEach((spec) => {
            initialVals[spec.metricSpecificationId] = ''
          })
        }
        state.submission.metricValues = initialVals
      })
      .addCase(fetchSubmissionDetailsThunk.rejected, (state, action) => {
        state.submission.loading = false
        state.submission.error = action.payload || 'Failed to load test details'
      })

      // Previous Attempt Files
      .addCase(fetchPreviousAttemptFilesThunk.pending, (state) => {
        state.submission.loadingPreviousFiles = true
      })
      .addCase(fetchPreviousAttemptFilesThunk.fulfilled, (state, action) => {
        state.submission.loadingPreviousFiles = false
        state.submission.previousAttemptFiles = action.payload || []
      })
      .addCase(fetchPreviousAttemptFilesThunk.rejected, (state) => {
        state.submission.loadingPreviousFiles = false
        state.submission.previousAttemptFiles = []
      })

      // Evidence File Upload
      .addCase(uploadEvidenceFileThunk.pending, (state) => {
        state.submission.uploadingFile = true
      })
      .addCase(uploadEvidenceFileThunk.fulfilled, (state, action) => {
        state.submission.uploadingFile = false
        state.submission.uploadedFiles.push(action.payload)
      })
      .addCase(uploadEvidenceFileThunk.rejected, (state, action) => {
        state.submission.uploadingFile = false
        state.submission.error = action.payload
      })

      // Submit Results (Guardrail 2: Resets submission state on success)
      .addCase(submitTestResultsThunk.pending, (state) => {
        state.submission.submitting = true
        state.submission.error = null
      })
      .addCase(submitTestResultsThunk.fulfilled, (state) => {
        // Guardrail 2: Automatically clear localized state to prevent stale data
        state.submission = {
          ...initialSubmissionState,
          submitSuccess: true,
        }
      })
      .addCase(submitTestResultsThunk.rejected, (state, action) => {
        state.submission.submitting = false
        state.submission.error = action.payload || 'Failed to submit test results'
      })

      // View Test Detail
      .addCase(fetchViewTestDetailThunk.pending, (state) => {
        state.view.loading = true
        state.view.error = null
      })
      .addCase(fetchViewTestDetailThunk.fulfilled, (state, action) => {
        state.view.loading = false
        state.view.testDetails = action.payload
        state.view.detailId = action.payload?.detailId
      })
      .addCase(fetchViewTestDetailThunk.rejected, (state, action) => {
        state.view.loading = false
        state.view.error = action.payload || 'Failed to load test details'
      })

      // View Files
      .addCase(fetchViewFilesThunk.pending, (state) => {
        state.view.loadingFiles = true
      })
      .addCase(fetchViewFilesThunk.fulfilled, (state, action) => {
        state.view.loadingFiles = false
        state.view.files = action.payload || []
      })
      .addCase(fetchViewFilesThunk.rejected, (state) => {
        state.view.loadingFiles = false
        state.view.files = []
      })

      // Eligible Users for Transfer
      .addCase(fetchEligibleUsersThunk.pending, (state) => {
        state.transfer.loadingUsers = true
        state.transfer.error = null
      })
      .addCase(fetchEligibleUsersThunk.fulfilled, (state, action) => {
        state.transfer.loadingUsers = false
        state.transfer.eligibleUsers = action.payload || []
      })
      .addCase(fetchEligibleUsersThunk.rejected, (state, action) => {
        state.transfer.loadingUsers = false
        state.transfer.error = action.payload || 'Failed to load eligible users'
        state.transfer.eligibleUsers = []
      })

      // Transfer Test (Guardrail 2: Resets transfer state on success)
      .addCase(transferTestThunk.pending, (state) => {
        state.transfer.submitting = true
        state.transfer.error = null
      })
      .addCase(transferTestThunk.fulfilled, (state) => {
        // Guardrail 2: Automatically clear localized state on success
        state.transfer = {
          ...initialTransferState,
          transferSuccess: true,
        }
      })
      .addCase(transferTestThunk.rejected, (state, action) => {
        state.transfer.submitting = false
        state.transfer.error = action.payload || 'Failed to transfer test'
      })

      // Test History
      .addCase(fetchTestHistoryThunk.pending, (state) => {
        state.history.loading = true
        state.history.error = null
      })
      .addCase(fetchTestHistoryThunk.fulfilled, (state, action) => {
        state.history.loading = false
        state.history.historyData = action.payload
      })
      .addCase(fetchTestHistoryThunk.rejected, (state, action) => {
        state.history.loading = false
        state.history.error = action.payload || 'Failed to load test history'
        state.history.historyData = null
      })
  },
})

export const {
  setMetricValue,
  setAllMetricValues,
  addUploadedFiles,
  updateFileRemarks,
  removeUploadedFile,
  togglePreviousFileId,
  setLinkedFileRemark,
  clearSubmissionState,
  clearViewState,
  openTransferModal,
  closeTransferModal,
  setSelectedUserId,
  setTransferReason,
  resetTransferModal,
  openHistoryModal,
  closeHistoryModal,
} = testExecutionSlice.actions

export default testExecutionSlice.reducer

