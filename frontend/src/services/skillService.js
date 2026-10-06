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
    const payload = {
      skillName: (data.skillName ?? data.name)?.trim(),
      categoryId: data.categoryId
    }
    const response = await axiosInstance.post('/skills', payload)
    return response.data
  },

  updateSkill: async (id, data) => {
    const payload = {
      ...(data.skillName !== undefined || data.name !== undefined
        ? { skillName: (data.skillName ?? data.name)?.trim() }
        : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {})
    }
    const response = await axiosInstance.patch(`/skills/${id}`, payload)
    return response.data
  },

  deleteSkill: async (id) => {
    const response = await axiosInstance.delete(`/skills/${id}`)
    return response.data
  }
}
