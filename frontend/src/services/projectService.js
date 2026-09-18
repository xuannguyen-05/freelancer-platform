import axiosInstance from '../lib/axios'

export const projectService = {
  createProject: async (data) => {
    const response = await axiosInstance.post('/projects', data)
    return response.data
  },

  getMyProjects: async (params = {}) => {
    const response = await axiosInstance.get('/projects/my', { params })
    return response.data
  },

  getProjectById: async (id) => {
    const response = await axiosInstance.get(`/projects/detail/${id}`)
    return response.data
  },

  updateProject: async (id, data) => {
    const response = await axiosInstance.patch(`/projects/${id}`, data)
    return response.data
  },

  completeProject: async (id) => {
    const response = await axiosInstance.patch(`/projects/${id}/complete`)
    return response.data
  },

  cancelProject: async (id) => {
    const response = await axiosInstance.patch(`/projects/${id}/cancel`)
    return response.data
  },

  getProjectTasks: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks`, { params })
    return response.data
  },

  createTask: async (projectId, data) => {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks`, data)
    return response.data
  },
}
