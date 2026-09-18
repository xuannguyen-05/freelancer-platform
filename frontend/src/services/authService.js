import axiosInstance from '../lib/axios'

export const authService = {
  register: async (data) => {
    const response = await axiosInstance.post('/auth/register', data)
    return response.data
  },

  login: async (data) => {
    const response = await axiosInstance.post('/auth/login', data)
    return response.data
  },

  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/logout', { refreshToken })
    return response.data
  },

  refreshToken: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh-token', { refreshToken })
    return response.data
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me')
    return response.data
  },
}
