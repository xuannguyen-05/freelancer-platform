import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('accessToken')
    if (!token) {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          token = parsed?.state?.accessToken
          if (token) {
            localStorage.setItem('accessToken', token)
          }
        }
      } catch (e) {
        console.warn('Failed to parse auth-storage in axios interceptor:', e)
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        let refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
              refreshToken = JSON.parse(authStorage)?.state?.refreshToken
            }
          } catch (e) {}
        }

        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken }
          )

          const { accessToken } = response.data.data
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return axiosInstance(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('auth-storage')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
