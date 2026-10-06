import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Star,
  Search,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Calendar,
  ExternalLink,
  TrendingUp,
  ChevronDown
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { reviewService } from '../services/reviewService'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'

export default function ReviewsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [ratingOpen, setRatingOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isFreelancer = user?.role === 'freelancer'

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reviewService.getMyReviews()
      setReviews(res.data || [])
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setError(err.response?.data?.message || err.message || t('review.errorLoadingReviews'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRatingOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Rating options
  const ratingOptions = [
    { id: 'all', label: t('review.allReviews', 'All'), dropdownLabel: t('review.allReviews', 'All') },
    { id: '5', label: t('review.rating5', '5 Stars'), dropdownLabel: '⭐ 5 Stars' },
    { id: '4', label: t('review.rating4', '4 Stars'), dropdownLabel: '⭐ 4 Stars' },
    { id: '3', label: t('review.rating3', '3 Stars'), dropdownLabel: '⭐ 3 Stars' },
    { id: '2', label: t('review.rating2', '2 Stars'), dropdownLabel: '⭐ 2 Stars' },
    { id: '1', label: t('review.rating1', '1 Star'), dropdownLabel: '⭐ 1 Star' },
  ]

  const activeOption = ratingOptions.find(o => o.id === activeTab) || ratingOptions[0]

  // Stats
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, distribution: {} }
    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    const avg = total > 0 ? Number((sum / total).toFixed(1)) : 0
    const distribution = {}
    for (let i = 1; i <= 5; i++) {
      distribution[i] = reviews.filter(r => r.rating === i).length
    }
    return { avg, total, distribution }
  }, [reviews])

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Rating tab filter
      if (activeTab !== 'all' && review.rating !== Number(activeTab)) {
        return false
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const commentMatch = review.comment?.toLowerCase().includes(q)
        const reviewerMatch = review.reviewer?.name?.toLowerCase().includes(q)
        const revieweeMatch = review.reviewee?.name?.toLowerCase().includes(q)
        const gigMatch = review.gigTitle?.toLowerCase().includes(q)
        if (!commentMatch && !reviewerMatch && !revieweeMatch && !gigMatch) {
          return false
        }
      }
      return true
    })
  }, [reviews, activeTab, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm])

  const PAGE_SIZE = 6
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE) || 1
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Star rating display
  const StarRating = ({ rating, size = 'sm' }) => {
    const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 dark:text-slate-700'
            )}
          />
        ))}
      </div>
    )
  }

  // The person to display (the other party)
  const getDisplayPerson = (review) => {
    if (isFreelancer) {
      // Freelancer sees reviewer (buyer)
      return { ...review.reviewer, roleLabel: t('contract.client', 'Client') }
    } else {
      // Buyer sees reviewee (freelancer)
      return { ...review.reviewee, roleLabel: t('contract.freelancer', 'Freelancer') }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:pt-8 md:pb-10 space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1)
            } else {
              navigate('/app/home')
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t('common.back', 'Quay lại')}</span>
        </button>
      </div>

      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
          <TypewriterText text={t('review.myReviews', 'My Reviews')} speed={30} />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
          <TypewriterText
            text={
              isFreelancer
                ? t('review.myReviewsSubtitleFreelancer', 'View reviews received from your clients.')
                : t('review.myReviewsSubtitleBuyer', 'Manage reviews you\'ve written for freelancers.')
            }
            speed={16}
            delay={250}
          />
        </p>
      </div>

      {/* 2. Stats Summary (only when we have reviews) */}
      {!loading && !error && reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {/* Average Rating Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex-1">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('review.avgRating', 'Average rating')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-foreground">{stats.avg}</span>
                <StarRating rating={Math.round(stats.avg)} size="sm" />
              </div>
            </div>
          </div>

          {/* Total Reviews Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex-1">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-950/50">
              <MessageSquare className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('review.totalReviews', 'reviews')}</p>
              <span className="text-2xl font-extrabold text-foreground">{stats.total}</span>
            </div>
          </div>

          {/* Rating Distribution Card */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{t('review.reviews', 'Reviews')}</p>
            </div>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-7 text-right font-semibold text-muted-foreground">{star}★</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Rating dropdown & Search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Rating dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Rating: {activeOption.label}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', ratingOpen && 'rotate-180')} />
          </button>

          {ratingOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {ratingOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setActiveTab(option.id)
                    setRatingOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors cursor-pointer',
                    activeTab === option.id
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold'
                      : 'text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  )}
                >
                  {option.dropdownLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('review.searchReviews', 'Search reviews...')}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 4. Reviews Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl border border-border bg-card animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="space-y-2.5 w-full">
                  <div className="h-4 bg-muted rounded-md w-1/3" />
                  <div className="h-3 bg-muted rounded-md w-1/4" />
                  <div className="h-3 bg-muted rounded-md w-full" />
                  <div className="h-3 bg-muted rounded-md w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-foreground">{error}</h3>
          <Button onClick={fetchReviews} variant="outline" className="gap-2 mx-auto cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            {t('common.tryAgain', 'Try Again')}
          </Button>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <Star className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            {reviews.length === 0
              ? t('review.noReviewsFound', 'No reviews yet')
              : t('review.noReviewsFiltered', 'No reviews match this filter.')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {reviews.length === 0
              ? (isFreelancer
                ? t('review.noReviewsDescFreelancer', 'You haven\'t received any reviews from clients yet.')
                : t('review.noReviewsDescBuyer', 'You haven\'t written any reviews yet. Reviews will appear after you complete an order.'))
              : t('review.searchReviews', 'Try searching with different keywords.')}
          </p>
          {reviews.length === 0 && (
            <Button
              onClick={() => navigate('/app/orders')}
              className="mt-2 text-xs font-semibold cursor-pointer"
            >
              {t('review.goToOrders', 'Go to Orders')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => {
            const reviewId = review.reviewId
            const person = getDisplayPerson(review)
            const gigTitle = review.gigTitle || review.orderTitle

            return (
              <div
                key={reviewId}
                className="group p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
              >
                {/* Top row: Avatar, name, rating, date */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <Avatar
                    src={person?.avatar}
                    fallback={(person?.name || 'U').charAt(0).toUpperCase()}
                    className="w-10 h-10 text-sm shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Name + role + rating */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {person?.name || 'User'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 whitespace-nowrap shrink-0">
                        {person?.roleLabel}
                      </span>
                    </div>

                    {/* Rating + Date */}
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Service / Order info */}
                    {gigTitle && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                          {isFreelancer
                            ? t('review.relatedService', 'Related service')
                            : t('review.reviewFor', 'Review for')}:
                        </span>
                        <span className="font-semibold text-foreground/80 truncate max-w-xs">
                          {gigTitle}
                        </span>
                      </div>
                    )}

                    {/* Action links */}
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {review.orderId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/app/orders/${review.orderId}`)
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t('review.viewOrder', 'View Order')}
                        </button>
                      )}
                      {review.gigId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/app/gigs/${review.gigId}`)
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t('review.viewService', 'View Service')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right side: large rating number */}
                  <div className="hidden sm:flex flex-col items-center justify-center shrink-0 pl-4 border-l border-border/60">
                    <span className="text-2xl font-extrabold text-foreground">{review.rating}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 mt-0.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && filteredReviews.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
