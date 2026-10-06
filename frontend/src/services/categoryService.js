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
    const payload = {
      categoryName: data.categoryName ?? data.name,
      description: data.description
    }
    const response = await axiosInstance.post('/categories', payload)
    return response.data
  },

  updateCategory: async (id, data) => {
    const payload = {
      ...(data.categoryName !== undefined || data.name !== undefined
        ? { categoryName: data.categoryName ?? data.name }
        : {}),
      ...(data.description !== undefined ? { description: data.description } : {})
    }
    const response = await axiosInstance.patch(`/categories/${id}`, payload)
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}`)
    return response.data
  }
}
