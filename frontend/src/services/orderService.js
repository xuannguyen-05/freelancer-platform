import axiosInstance from '../lib/axios'

export const orderService = {
  createOrder: async (data) => {
    const response = await axiosInstance.post('/orders', data)
    return response.data
  },

  getMyOrders: async () => {
    const response = await axiosInstance.get('/orders/my')
    return response.data
  },

  getFreelancerOrders: async () => {
    const response = await axiosInstance.get('/orders/freelancer')
    return response.data
  },

  getOrderById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`)
    return response.data
  },

  cancelOrder: async (id) => {
    const response = await axiosInstance.patch(`/orders/${id}/cancel`)
    return response.data
  },
}
