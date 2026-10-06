import axiosInstance from '../lib/axios'

export const conversationService = {
  getMyConversations: async () => {
    const response = await axiosInstance.get('/conversations')
    return response.data
  },

  getUnreadCount: async () => {
    const response = await axiosInstance.get('/conversations/unread-count')
    return response.data
  },

  createConversation: async (payload) => {
    const data = typeof payload === 'object' && payload !== null ? payload : { orderId: payload }
    const response = await axiosInstance.post('/conversations', data)
    return response.data
  },

  getConversationByOrderId: async (orderId) => {
    const response = await axiosInstance.get(`/conversations/${orderId}`)
    return response.data
  },

  getMessages: async (conversationId) => {
    const response = await axiosInstance.get(`/conversations/${conversationId}/messages`)
    return response.data
  },

  sendMessage: async (conversationId, content) => {
    const response = await axiosInstance.post(`/conversations/${conversationId}/messages`, { content })
    return response.data
  },
}
