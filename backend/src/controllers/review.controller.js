const {createReviewService, getReviewsByFreelancerService, getReviewsByGigService, getMyReviewsService} = require("../services/review.service")
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
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
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
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getReviewsByGig = async(req, res) => {
    try {
        const gigId = req.params.gigId

        const reviews = await getReviewsByGigService(gigId)

        res.status(200).json({
            message: "Get reviews for gig successfully",
            data: reviews.map(formatReview)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getMyReviews = async(req, res) => {
    try {
        const userId = req.user.userID
        const role = req.user.role

        const reviews = await getMyReviewsService(userId, role)

        res.status(200).json({
            message: "Get my reviews successfully",
            data: reviews.map(formatReview)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

module.exports = {createReview, getReviewsByFreelancer, getReviewsByGig, getMyReviews}