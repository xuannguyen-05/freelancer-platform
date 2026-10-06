import axiosInstance from '../lib/axios'

export const reviewService = {
  getMyReviews: async () => {
    const response = await axiosInstance.get('/reviews/me')
    return response.data
  },
  getReviewsByFreelancer: async (freelancerId) => {
    const response = await axiosInstance.get(`/reviews/${freelancerId}`)
    return response.data
  },
  getReviewsByGig: async (gigId) => {
    const response = await axiosInstance.get(`/reviews/gig/${gigId}`)
    return response.data
  },
  createReview: async (data) => {
    const response = await axiosInstance.post('/reviews', data)
    return response.data
  }
}
