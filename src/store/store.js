import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import generateArReducer from './slices/generateArSlice'
import trfRequestsReducer from './slices/trfRequestsSlice'
import qcRequestsReducer from './slices/qcRequestsSlice'
import qcRequestTrackingReducer from './slices/qcRequestTrackingSlice'
import assignedTestsReducer from './slices/assignedTestsSlice'
import incidentsReducer from './slices/incidentsSlice'
import testExecutionReducer from './slices/testExecutionSlice'
import grnFailuresReducer from './slices/grnFailuresSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generateAr: generateArReducer,
    trfRequests: trfRequestsReducer,
    qcRequests: qcRequestsReducer,
    qcRequestTracking: qcRequestTrackingReducer,
    assignedTests: assignedTestsReducer,
    incidents: incidentsReducer,
    testExecution: testExecutionReducer,
    grnFailures: grnFailuresReducer,
  },
})

export default store
