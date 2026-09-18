import axiosInstance from '../lib/axios'

export const contractService = {
  createContract: async (data) => {
    const response = await axiosInstance.post('/contracts', data)
    return response.data
  },

  getMyContracts: async () => {
    const response = await axiosInstance.get('/contracts/my')
    return response.data
  },

  getContractById: async (id) => {
    const response = await axiosInstance.get(`/contracts/detail/${id}`)
    return response.data
  },

  updateContract: async (id, data) => {
    const response = await axiosInstance.patch(`/contracts/${id}`, data)
    return response.data
  },

  updateContractStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/contracts/${id}/status`, { status })
    return response.data
  },

  payContract: async (id, amount) => {
    const response = await axiosInstance.post(`/contracts/${id}/pay`, { amount })
    return response.data
  },

  getContractBalance: async (id) => {
    const response = await axiosInstance.get(`/contracts/${id}/balance`)
    return response.data
  },

  getContractProgressFinance: async (id) => {
    const response = await axiosInstance.get(`/contracts/${id}/progress-finance`)
    return response.data
  },

  getProjectSummary: async (projectId) => {
    const response = await axiosInstance.get(`/contracts/project/${projectId}/summary`)
    return response.data
  },
}
