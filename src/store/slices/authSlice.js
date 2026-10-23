import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/client'

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      const { token, user } = response.data
      localStorage.setItem('authToken', token)
      return { token, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      )
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('authToken')
  // Optionally call backend logout endpoint:
  // await api.post('/auth/logout')
})

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const loadFromStorage = () => {
  const token = localStorage.getItem('authToken')
  const userStr = localStorage.getItem('user')
  return {
    token,
    user: userStr ? JSON.parse(userStr) : null,
    isAuthenticated: !!token,
  }
}

const initialState = {
  ...loadFromStorage(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
