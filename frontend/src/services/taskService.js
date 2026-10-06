import axiosInstance from '../lib/axios'

export const taskService = {
  getTasksByProject: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks`, { params })
    return response.data
  },

  createTask: async (projectId, data) => {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks`, data)
    return response.data
  },

  getTaskById: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}`)
    return response.data
  },

  updateTask: async (id, data) => {
    const response = await axiosInstance.patch(`/tasks/${id}`, data)
    return response.data
  },

  updateTaskStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/tasks/${id}/status`, { status })
    return response.data
  },

  getProjectStats: async (projectId) => {
    const response = await axiosInstance.get(`/tasks/project/${projectId}/stats`)
    return response.data
  },

  getProjectProgress: async (projectId) => {
    const response = await axiosInstance.get(`/tasks/project/${projectId}/progress`)
    return response.data
  },
}
