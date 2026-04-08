const {createReviewService, getReviewsByFreelancerService} = require("../services/review.service")
const formatReview = require("../utils/formatReview")

const createReview = async(req, res) => {
    try {
        const userId = req.user.userID

        const {orderId, rating, comment} = req.body

        const review = await createReviewService(orderId, userId, rating, comment)

        res.status(201).json({
            message: "Review created successfully",
            data: formatReview(review)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getReviewsByFreelancer = async(req, res) => {
    try {
        const freelancerId = req.params.freelancerId

        const reviews = await getReviewsByFreelancerService(freelancerId)

        res.status(200).json({
            message: "Get reviews successfully",
            data: reviews.map(formatReview)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

module.exports = {createReview, getReviewsByFreelancer}