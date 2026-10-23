import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more slices here as features are developed
    // testParameter: testParameterReducer,
    // inward: inwardReducer,
  },
})

export default store
