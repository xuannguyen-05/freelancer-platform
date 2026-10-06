import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, X, AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Button, Dialog } from '../ui'
import { reviewService } from '../../services/reviewService'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

export default function ReviewModal({ isOpen, onClose, order, onSuccess }) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setHoverRating(0)
      setComment('')
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen || !order) return null

  const orderId = order.id || order._id
  const gigTitle = order.gig?.title || t('order.title', 'Dịch vụ')
  const freelancerName = order.freelancer?.name || t('orderDetail.freelancer', 'Freelancer')

  const activeRating = hoverRating || rating

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return t('review.rateDescription1', 'Rất không hài lòng')
      case 2:
        return t('review.rateDescription2', 'Không hài lòng')
      case 3:
        return t('review.rateDescription3', 'Bình thường')
      case 4:
        return t('review.rateDescription4', 'Hài lòng')
      case 5:
        return t('review.rateDescription5', 'Rất hài lòng')
      default:
        return ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating || rating < 1 || rating > 5) {
      setError(t('review.ratingRequired', 'Vui lòng chọn số sao đánh giá'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      await reviewService.createReview({
        orderId,
        rating: Number(rating),
        comment: comment.trim()
      })
      toast.success(t('review.submitReviewSuccess', 'Đánh giá đã được gửi thành công!'))
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      setError(err.response?.data?.message || err.message || t('review.errorLoadingReviews', 'Gửi đánh giá thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        if (!loading) onClose()
      }}
      className="max-w-lg p-0 rounded-3xl overflow-hidden shadow-2xl"
    >
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white relative">
        <button
          type="button"
          onClick={() => {
            if (!loading) onClose()
          }}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{t('review.modalTitle', 'Đánh giá dịch vụ')}</span>
        </div>
        <h3 className="text-xl font-extrabold text-white line-clamp-1">
          {gigTitle}
        </h3>
        <p className="text-xs text-white/80 mt-1">
          {t('review.reviewFor', 'Đánh giá cho')}: <span className="font-semibold text-white">{freelancerName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Rating Stars */}
        <div className="space-y-2 text-center py-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('review.ratePrompt', 'Chọn mức đánh giá của bạn')}
          </label>
          <div className="flex items-center justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating
              return (
                <button
                  key={star}
                  type="button"
                  disabled={loading}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-hidden"
                >
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      isFilled
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                        : 'text-slate-200 dark:text-slate-700'
                    )}
                  />
                </button>
              )
            })}
          </div>

          <div className="h-5 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 transition-all">
              {getRatingLabel(activeRating)}
            </span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              {t('review.commentLabel', 'Nhận xét của bạn')}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {comment.length}/2000
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={2000}
            disabled={loading}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('review.commentPlaceholder', 'Chia sẻ chi tiết trải nghiệm của bạn về dịch vụ này...')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="text-xs font-semibold px-4 cursor-pointer"
          >
            {t('review.cancel', 'Hủy')}
          </Button>
          <Button
            type="submit"
            disabled={loading || !rating}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-6 shadow-sm gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('review.submitting', 'Đang gửi...')}</span>
              </>
            ) : (
              <span>{t('review.submitReview', 'Gửi đánh giá')}</span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
