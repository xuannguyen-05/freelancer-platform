import axiosInstance from '../lib/axios'

export const skillService = {
  getSkills: async () => {
    const response = await axiosInstance.get('/skills')
    return response.data
  },

  getSkillById: async (id) => {
    const response = await axiosInstance.get(`/skills/${id}`)
    return response.data
  },

  createSkill: async (data) => {
    const response = await axiosInstance.post('/skills', data)
    return response.data
  },

  updateSkill: async (id, data) => {
    const response = await axiosInstance.patch(`/skills/${id}`, data)
    return response.data
  },

  deleteSkill: async (id) => {
    const response = await axiosInstance.delete(`/skills/${id}`)
    return response.data
  }
}
