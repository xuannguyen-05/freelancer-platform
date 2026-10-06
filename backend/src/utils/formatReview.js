const formatReview = (review) => {
    if (!review) return null

    const id = review._id ? String(review._id) : (review.id ? String(review.id) : (review.reviewId ? String(review.reviewId) : undefined))

    return {
        id,
        _id: id,
        reviewId: id,
        orderId: review.orderId ? String(review.orderId) : undefined,
        gigId: review.gigId ? String(review.gigId) : undefined,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        reviewer: review.reviewer ? {
            id: review.reviewer._id ? String(review.reviewer._id) : (review.reviewer.id ? String(review.reviewer.id) : undefined),
            _id: review.reviewer._id ? String(review.reviewer._id) : (review.reviewer.id ? String(review.reviewer.id) : undefined),
            name: review.reviewer.name || "",
            avatar: review.reviewer.avatar || ""
        } : null,
        reviewee: review.reviewee ? {
            id: review.reviewee._id ? String(review.reviewee._id) : (review.reviewee.id ? String(review.reviewee.id) : undefined),
            _id: review.reviewee._id ? String(review.reviewee._id) : (review.reviewee.id ? String(review.reviewee.id) : undefined),
            name: review.reviewee.name || "",
            avatar: review.reviewee.avatar || ""
        } : null,
        gigTitle: review.gigTitle || undefined,
        orderTitle: review.orderTitle || undefined
    }
}

module.exports = formatReview