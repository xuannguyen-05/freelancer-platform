const formatReview = (review) => {
    if (!review) return null

    return {
        reviewId: review._id ? String(review._id) : undefined,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: review.reviewer ? {
        id: review.reviewer._id ? String(review.reviewer._id) : undefined,
        name: review.reviewer.name,
        avatar: review.reviewer.avatar
            } : null
    }
}

module.exports = formatReview