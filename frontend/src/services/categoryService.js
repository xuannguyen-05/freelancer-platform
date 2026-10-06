import axiosInstance from '../lib/axios'

export const categoryService = {
  getCategories: async () => {
    const response = await axiosInstance.get('/categories')
    return response.data
  },

  getCategoryById: async (id) => {
    const response = await axiosInstance.get(`/categories/${id}`)
    return response.data
  },

  createCategory: async (data) => {
    const response = await axiosInstance.post('/categories', data)
    return response.data
  },

  updateCategory: async (id, data) => {
    const response = await axiosInstance.patch(`/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}`)
    return response.data
  }
}
