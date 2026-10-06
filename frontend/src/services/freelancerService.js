import axiosInstance from '../lib/axios'

export const freelancerService = {
  getFreelancers: async (params = {}) => {
    const response = await axiosInstance.get('/freelancers', { params })
    return response.data
  },

  getFreelancerById: async (id) => {
    const response = await axiosInstance.get(`/freelancers/${id}`)
    return response.data
  },

  getMyProfile: async () => {
    const response = await axiosInstance.get('/freelancers/me')
    return response.data
  },

  updateMyProfile: async (data) => {
    const response = await axiosInstance.patch('/freelancers/me', data)
    return response.data
  },

  createProfile: async (data) => {
    const response = await axiosInstance.post('/freelancers', data)
    return response.data
  },

  getSkills: async () => {
    const response = await axiosInstance.get('/skills')
    return response.data
  },

  getMyApplication: async () => {
    const response = await axiosInstance.get('/freelancers/my-application')
    return response.data
  }
}
