const mongoose = require("mongoose")
const Review = require("../models/review")
const Order = require("../models/order")
const User = require("../models/user")
const Gig = require("../models/gig")
const AppError = require("../utils/AppError")
const { createNotificationSafe } = require("./notification.service")
const {ORDER_STATUS} =  require("../constants/orderStatus")

const createReviewService = async(orderId, userId, rating, comment) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid User ID", 400, "INVALID_USER_ID")
    }

    const reviewer = await User.findById(userId).select("name avatar role")
    if (!reviewer) {
        throw new AppError("User Not Found", 404, "USER_NOT_FOUND")
    }

    if (reviewer.role !== "buyer") {
        throw new AppError("Only buyers can submit reviews", 403, "FORBIDDEN")
    }

    const numRating = Number(rating)
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        throw new AppError("Rating must be an integer between 1 and 5", 400, "INVALID_RATING")
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400, "INVALID_ORDER_ID")
    }

    const order = await Order.findById(orderId)

    if (!order) {
        throw new AppError("Order Not Found", 404, "ORDER_NOT_FOUND")
    }

    if (String(order.buyer._id) !== String(userId)) {
        throw new AppError("Only the buyer who owns this order can submit a review", 403, "FORBIDDEN")
    }

    if (String(order.freelancer._id) === String(userId)) {
        throw new AppError("Freelancers cannot review their own service", 400, "CANNOT_REVIEW_OWN_SERVICE")
    }

    if (order.status !== ORDER_STATUS.COMPLETED) {
        throw new AppError("Review can only be submitted for completed orders", 400, "ORDER_NOT_COMPLETED")
    }

    const existing = await Review.findOne({ orderId })
    if (existing) {
        throw new AppError("You have already reviewed this order", 400, "ALREADY_REVIEWED")
    }

    if (!order.freelancer || !order.freelancer._id) {
        throw new AppError("Freelancer not found on order", 400, "FREELANCER_NOT_FOUND")
    }

    const gigId = order.gig?._id || null

    const review = await Review.create({
        orderId,
        gigId,
        reviewer: {
            _id: userId,
            name: reviewer.name || order.buyer.name
        },
        reviewee: {
            _id: order.freelancer._id,
            name: order.freelancer.name
        },
        rating: numRating,
        comment: comment ? String(comment).trim() : ""
    })

    // Cross-user Notification: Notify only the reviewed Freelancer
    createNotificationSafe({
        recipient: order.freelancer._id,
        sender: userId,
        type: "review_received",
        entityType: "review",
        entityId: review._id,
        link: `/app/orders/${order._id}`,
        metadata: {
            rating: numRating,
            actorName: reviewer.name || order.buyer.name
        }
    })

    // Recalculate Gig rating and reviewCount strictly from real DB reviews
    if (gigId) {
        const gigReviews = await Review.find({ gigId: new mongoose.Types.ObjectId(gigId) }).select("rating").lean()
        const count = gigReviews.length
        const avg = count > 0 ? Number((gigReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 0
        await Gig.findByIdAndUpdate(gigId, {
            $set: {
                rating: avg,
                reviewCount: count
            }
        })
    }

    // Recalculate Freelancer user profile rating and reviewCount strictly from real DB reviews
    const freelancerReviews = await Review.find({ "reviewee._id": new mongoose.Types.ObjectId(order.freelancer._id) }).select("rating").lean()
    const flCount = freelancerReviews.length
    const flAvg = flCount > 0 ? Number((freelancerReviews.reduce((sum, r) => sum + r.rating, 0) / flCount).toFixed(1)) : 0
    await User.findByIdAndUpdate(order.freelancer._id, {
        $set: {
            "freelancerProfile.rating": flAvg,
            "freelancerProfile.reviewCount": flCount
        }
    })

    return {
        ...review.toObject(),
        reviewer: {
            _id: userId,
            name: reviewer.name || order.buyer.name,
            avatar: reviewer.avatar || ""
        }
    }
}

const getReviewsByFreelancerService = async(freelancerId) => {
    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
        throw new AppError("Invalid freelancer ID", 400)
    }

    const reviews = await Review.find({ "reviewee._id": new mongoose.Types.ObjectId(freelancerId) })
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

const getReviewsByGigService = async (gigId) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid gig ID", 400)
    }

    const reviews = await Review.find({ gigId: new mongoose.Types.ObjectId(gigId) })
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

const getMyReviewsService = async (userId, role) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    let query
    if (role === "freelancer") {
        // Freelancer sees reviews received
        query = { "reviewee._id": new mongoose.Types.ObjectId(userId) }
    } else {
        // Buyer sees reviews they wrote
        query = { "reviewer._id": new mongoose.Types.ObjectId(userId) }
    }

    const reviews = await Review.find(query)
        .sort({ createdAt: -1 })
        .lean()

    if (reviews.length === 0) return []

    // Collect unique user IDs for avatar lookup
    const userIds = [...new Set([
        ...reviews.map(r => String(r.reviewer._id)),
        ...reviews.map(r => String(r.reviewee._id))
    ])]
    const users = await User.find({ _id: { $in: userIds } }).select("name avatar").lean()
    const userMap = new Map(users.map(u => [String(u._id), u]))

    // Collect unique order IDs and gig IDs for title lookup
    const orderIds = [...new Set(reviews.filter(r => r.orderId).map(r => String(r.orderId)))]
    const gigIds = [...new Set(reviews.filter(r => r.gigId).map(r => String(r.gigId)))]

    const [orders, gigs] = await Promise.all([
        orderIds.length > 0
            ? Order.find({ _id: { $in: orderIds } }).select("gig.title gig._id buyer freelancer").lean()
            : [],
        gigIds.length > 0
            ? Gig.find({ _id: { $in: gigIds } }).select("title img_url").lean()
            : []
    ])

    const orderMap = new Map(orders.map(o => [String(o._id), o]))
    const gigMap = new Map(gigs.map(g => [String(g._id), g]))

    return reviews.map(review => {
        const reviewerUser = userMap.get(String(review.reviewer._id))
        const revieweeUser = userMap.get(String(review.reviewee._id))
        const order = review.orderId ? orderMap.get(String(review.orderId)) : null
        const gig = review.gigId ? gigMap.get(String(review.gigId)) : null

        return {
            ...review,
            reviewer: {
                _id: review.reviewer._id,
                name: reviewerUser?.name || review.reviewer.name,
                avatar: reviewerUser?.avatar || ""
            },
            reviewee: {
                _id: review.reviewee._id,
                name: revieweeUser?.name || review.reviewee.name,
                avatar: revieweeUser?.avatar || ""
            },
            gigTitle: gig?.title || order?.gig?.title || null,
            gigImgUrl: gig?.img_url || null,
            orderTitle: order?.gig?.title || null
        }
    })
}

module.exports = {createReviewService, getReviewsByFreelancerService, getReviewsByGigService, getMyReviewsService}