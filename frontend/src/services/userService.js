import axiosInstance from '../lib/axios'

export const userService = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me')
    return response.data
  },

  updateProfile: async (data) => {
    // Check if data is FormData (for avatar file upload) or JSON
    const isFormData = data instanceof FormData
    const response = await axiosInstance.patch('/users/me', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return response.data
  },

  changePassword: async (data) => {
    const response = await axiosInstance.post('/users/change-password', data)
    return response.data
  },

  lookupByEmail: async (email) => {
    const response = await axiosInstance.get('/users/lookup', { params: { email } })
    return response.data
  },
}
