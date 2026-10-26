import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Extract employee_id from the stored user JSON. */
function getEmployeeId() {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.employee_id ?? user.employeeId ?? null
    }
  } catch { /* ignore */ }
  return null
}

// Request interceptor — attach auth token and employee ID if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const employeeId = getEmployeeId()
  if (employeeId) {
    config.headers['X-Employee-ID'] = employeeId
  }
  return config
})

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
