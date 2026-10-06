import axiosInstance from '../lib/axios'

export const adminService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/admin/overview')
    return response.data
  },

  getAnalytics: async () => {
    const response = await axiosInstance.get('/admin/analytics')
    return response.data
  },

  getApplications: async (params = {}) => {
    const response = await axiosInstance.get('/admin/applications', { params })
    return response.data
  },

  getApplicationById: async (id) => {
    const response = await axiosInstance.get(`/admin/applications/${id}`)
    return response.data
  },

  approveApplication: async (id) => {
    const response = await axiosInstance.post(`/admin/applications/${id}/approve`)
    return response.data
  },

  rejectApplication: async (id, data = {}) => {
    const response = await axiosInstance.post(`/admin/applications/${id}/reject`, data)
    return response.data
  }
}
