import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import generateArReducer from './slices/generateArSlice'
import uploadTrfReducer from './slices/uploadTrfSlice'
import qcRequestsReducer from './slices/qcRequestsSlice'
import qcRequestTrackingReducer from './slices/qcRequestTrackingSlice'
import assignedTestsReducer from './slices/assignedTestsSlice'
import incidentsReducer from './slices/incidentsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generateAr: generateArReducer,
    uploadTrf: uploadTrfReducer,
    qcRequests: qcRequestsReducer,
    qcRequestTracking: qcRequestTrackingReducer,
    assignedTests: assignedTestsReducer,
    incidents: incidentsReducer,
  },
})

export default store
