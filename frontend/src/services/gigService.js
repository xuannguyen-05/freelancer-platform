import axiosInstance from '../lib/axios'

export const gigService = {
  getGigs: async (params = {}) => {
    const response = await axiosInstance.get('/gigs', { params })
    return response.data
  },

  getGigById: async (id) => {
    const response = await axiosInstance.get(`/gigs/${id}`)
    return response.data
  },

  createGig: async (data) => {
    const response = await axiosInstance.post('/gigs', data)
    return response.data
  },

  updateGig: async (id, data) => {
    const response = await axiosInstance.patch(`/gigs/${id}`, data)
    return response.data
  },

  deleteGig: async (id) => {
    const response = await axiosInstance.delete(`/gigs/${id}`)
    return response.data
  },

  getGigPackages: async (gigId) => {
    const response = await axiosInstance.get(`/gigs/${gigId}/packages`)
    return response.data
  },

  createPackage: async (gigId, data) => {
    const response = await axiosInstance.post(`/gigs/${gigId}/packages`, data)
    return response.data
  },
}
