const mongoose = require("mongoose")
const Review = require("../models/review")
const Order = require("../models/order")
const User = require("../models/user")
const AppError = require("../utils/AppError")
const {ORDER_STATUS} =  require("../constants/orderStatus")

const createReviewService = async(orderId, userId, rating, comment) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    const order = await Order.findById(orderId)

    if(!order){
        throw new AppError("Order Not Found", 404)
    }

    if(String(order.buyer._id) !== String(userId)){
        throw new AppError("Forbidden", 403)
    }

    if(order.status !== ORDER_STATUS.COMPLETED){
        throw new AppError("Order must be COMPLETED", 400)
    }

    const existing = await Review.findOne({
        orderId,
        "reviewer._id": userId
    })

    if (existing) {
        throw new AppError("You already reviewed this order", 400)
    }

    const reviewer = await User.findById(userId).select("name avatar")

    const review = await Review.create({
        orderId,
        reviewer: {
            _id: userId,
            name: reviewer?.name || order.buyer.name
        },
        reviewee: {
            _id: order.freelancer._id,
            name: order.freelancer.name
        },
        rating,
        comment: comment || ""
    })

    const freelancer = await User.findById(order.freelancer._id)
    if (freelancer) {
        const currentCount = freelancer.freelancerProfile?.reviewCount ?? 0
        const currentRating = freelancer.freelancerProfile?.rating ?? 0
        const newCount = currentCount + 1
        const newRating = Number(((currentRating * currentCount + Number(rating)) / newCount).toFixed(2))

        freelancer.freelancerProfile = {
            ...freelancer.freelancerProfile,
            rating: newRating,
            reviewCount: newCount
        }
        await freelancer.save()
    }

    return {
        ...review.toObject(),
        reviewer: {
            _id: userId,
            name: reviewer?.name || order.buyer.name,
            avatar: reviewer?.avatar || ""
        }
    }
}

const getReviewsByFreelancerService = async(freelancerId) => {
    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
        throw new AppError("Invalid freelancer ID", 400)
    }

    const reviews = await Review.find({ "reviewee._id": freelancerId })
        .sort({ createdAt: -1 })
        .lean()

    const reviewerIds = [...new Set(reviews.map((r) => String(r.reviewer._id)))]
    const reviewers = await User.find({ _id: { $in: reviewerIds } }).select("name avatar").lean()
    const reviewerMap = new Map(reviewers.map((u) => [String(u._id), u]))

    return reviews.map((review) => ({
        ...review,
        reviewer: {
            _id: review.reviewer._id,
            name: reviewerMap.get(String(review.reviewer._id))?.name || review.reviewer.name,
            avatar: reviewerMap.get(String(review.reviewer._id))?.avatar || ""
        }
    }))
}

module.exports = {createReviewService, getReviewsByFreelancerService}