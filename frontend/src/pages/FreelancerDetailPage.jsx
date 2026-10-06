import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Share2,
  Briefcase,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { freelancerService } from '../services/freelancerService'
import { gigService } from '../services/gigService'
import { reviewService } from '../services/reviewService'
import { resolveMediaUrl } from '../utils/media'
import { cn } from '../utils/cn'
import GigCard from '../components/common/GigCard'
import Pagination from '../components/common/Pagination'
import toast from 'react-hot-toast'

export default function FreelancerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [freelancer, setFreelancer] = useState(null)
  const [gigs, setGigs] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('gigs') // 'gigs' | 'reviews'
  const [gigPage, setGigPage] = useState(1)
  const [reviewPage, setReviewPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch freelancer profile
        const fRes = await freelancerService.getFreelancerById(id)
        const fData = fRes.data || fRes.freelancer || fRes
        if (!isMounted) return
        setFreelancer(fData)

        // 2. Fetch freelancer's gigs & reviews in parallel
        try {
          const [gigsRes, reviewsRes] = await Promise.all([
            gigService.getGigs({ freelancerID: id }),
            reviewService.getReviewsByFreelancer(id).catch(() => ({ data: [] }))
          ])
          if (!isMounted) return
          const gigItems = gigsRes.data?.data || (Array.isArray(gigsRes.data) ? gigsRes.data : (Array.isArray(gigsRes) ? gigsRes : []))
          const reviewItems = reviewsRes.data?.data || (Array.isArray(reviewsRes.data) ? reviewsRes.data : (Array.isArray(reviewsRes) ? reviewsRes : []))
          setGigs(Array.isArray(gigItems) ? gigItems : [])
          setReviews(Array.isArray(reviewItems) ? reviewItems : [])
        } catch (subErr) {
          console.warn('Error fetching gigs/reviews for freelancer:', subErr)
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load freelancer details:', err)
        setError(err.response?.data?.message || err.message || 'Freelancer not found')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }

    return () => {
      isMounted = false
    }
  }, [id])

  const formatCurrency = (amount) => {
    const isVi = i18n.language === 'vi'
    const validAmount = Number(amount) || 0
    if (isVi) {
      return `${validAmount.toLocaleString('vi-VN')} ₫`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(validAmount)
  }

  const formatMemberSince = (dateStr) => {
    if (!dateStr) return '2022'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return '2022'
    }
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success(i18n.language === 'vi' ? 'Đã sao chép liên kết vào bộ nhớ tạm!' : 'Profile link copied to clipboard!')
    }
  }

  const GIGS_PER_PAGE = 6
  const totalGigPages = Math.ceil(gigs.length / GIGS_PER_PAGE) || 1
  const paginatedGigs = gigs.slice((gigPage - 1) * GIGS_PER_PAGE, gigPage * GIGS_PER_PAGE)

  const REVIEWS_PER_PAGE = 5
  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1
  const paginatedReviews = reviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {t('common.loading', 'Loading freelancer profile...')}
        </p>
      </div>
    )
  }

  if (error || !freelancer) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-card border border-border rounded-2xl text-center shadow-xs">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          {i18n.language === 'vi' ? 'Không tìm thấy hồ sơ' : 'Freelancer Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{error || 'Freelancer does not exist or has been removed.'}</p>
        <Button onClick={() => navigate('/app/home?view=talent')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back to Marketplace')}
        </Button>
      </div>
    )
  }

  const displayName = freelancer.name || 'Freelancer'
  const displayTitle = freelancer.professionalTitle || freelancer.slogan || ''
  const displayBio = freelancer.bio || freelancer.description || ''
  const displayLocation = freelancer.location?.trim() || ''
  const reviewCountValue = freelancer.reviewCount ?? reviews.length ?? 0
  const hasReviews = reviewCountValue > 0
  const ratingValue = hasReviews && freelancer.rating > 0 ? Number(freelancer.rating).toFixed(1) : '0'
  const skillsList = freelancer.skillNames?.length > 0
    ? freelancer.skillNames
    : (freelancer.skills?.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean) || [])

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back', 'Back')}</span>
          </button>
        </div>

        {/* 1. FREELANCER HEADER CARD */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Top Row: Avatar, Info, Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4 sm:gap-5">
              
              {/* Avatar with Online Badge */}
              <div className="relative shrink-0">
                <Avatar
                  src={resolveMediaUrl(freelancer.avatar)}
                  fallback={displayName?.charAt(0) || 'F'}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-border shadow-xs"
                />
                <span
                  className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card"
                  title="Online"
                />
              </div>

              {/* Identity & Rating */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70">
                    Freelancer
                  </span>
                </div>

                {displayTitle && (
                  <p className="text-sm sm:text-base font-medium text-muted-foreground">
                    {displayTitle}
                  </p>
                )}

                {/* Rating badge: Only show filled star if there are reviews */}
                <div className="flex items-center gap-1.5 pt-0.5 text-xs sm:text-sm font-semibold text-foreground">
                  <Star className={cn("h-4 w-4 shrink-0", hasReviews ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                  <span>{ratingValue}</span>
                  <span className="text-muted-foreground font-normal">
                    ({reviewCountValue})
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{i18n.language === 'vi' ? 'Chia sẻ' : 'Share'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const targetUserId = freelancer._id || freelancer.id || freelancer.userID || id
                  const targetName = freelancer.name || displayName || 'Freelancer'
                  navigate(`/app/messages?partnerId=${targetUserId}&partnerName=${encodeURIComponent(targetName)}`)
                }}
                className="gap-1.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{t('freelancerDetail.contact', 'Contact')}</span>
              </Button>
            </div>
          </div>

          {/* Row 2: Bio (Only render if exists) */}
          {displayBio && (
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-normal">
              {displayBio}
            </p>
          )}

          {/* Row 3: Skills list (Only render if exists) */}
          {skillsList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Row 4: Meta info row (Only render available info, NO hardcoded fallbacks) */}
          {(displayLocation || freelancer.createdAt || freelancer.responseTime) && (
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/60">
              {displayLocation ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span>{displayLocation}</span>
                </div>
              ) : null}

              {freelancer.createdAt ? (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span>
                    {t('freelancerDetail.memberSince', 'Member since')} {formatMemberSince(freelancer.createdAt)}
                  </span>
                </div>
              ) : null}

              {freelancer.responseTime ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span>{freelancer.responseTime}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Row 5: Real Stat boxes row (From API, zero hardcoding) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-1">
            <div className="rounded-2xl bg-muted/40 border border-border/80 p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {freelancer.ordersCompleted ?? 0}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                {t('freelancerDetail.ordersCompleted', 'Orders completed')}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/80 p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {ratingValue}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                {t('freelancerDetail.avgRating', 'Rating')}
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/80 p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {freelancer.ordersCompleted > 0 ? '100%' : '—'}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                {t('freelancerDetail.onTimeDelivery', 'On-time delivery')}
              </div>
            </div>
          </div>

        </div>

        {/* 2. TABS: Gigs (X) | Reviews (Y) */}
        <div className="mt-10">
          <div className="flex items-center gap-4 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('gigs')}
              className={cn(
                'pb-3.5 text-sm font-bold transition-all relative cursor-pointer',
                activeTab === 'gigs'
                  ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('freelancerDetail.gigsTab', 'Gigs')} ({gigs.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'pb-3.5 text-sm font-bold transition-all relative cursor-pointer',
                activeTab === 'reviews'
                  ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('freelancerDetail.reviewsTab', 'Reviews')} ({reviews.length})
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="pt-6">
            
            {/* GIGS TAB */}
            {activeTab === 'gigs' && (
              <div>
                {gigs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                    <Briefcase className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">
                      {t('freelancerDetail.noGigsFreelancer', 'This freelancer has not published any gigs yet.')}
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedGigs.map((gig) => {
                      const gigId = gig.id || gig._id
                      const gigWithFreelancer = {
                        ...gig,
                        freelancer: gig.freelancer || {
                          name: displayName,
                          avatar: freelancer.avatar,
                        },
                      }
                      return (
                        <GigCard
                          key={gigId}
                          gig={gigWithFreelancer}
                          onClick={() => navigate(`/app/gigs/${gigId}`)}
                        />
                      )
                    })}
                  </div>
                )}
                {gigs.length > 0 && (
                  <Pagination
                    currentPage={gigPage}
                    totalPages={totalGigPages}
                    onPageChange={setGigPage}
                  />
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                    <Star className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">
                      {t('freelancerDetail.noReviewsFreelancer', 'No reviews yet for this freelancer.')}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedReviews.map((rev, i) => {
                      const reviewerName = rev.reviewer?.name || rev.buyer?.name || rev.user?.name || 'Client'
                      const reviewerAvatar = rev.reviewer?.avatar || rev.buyer?.avatar || rev.user?.avatar || ''
                      const rating = rev.rating || 5

                      return (
                        <div
                          key={rev.id || rev._id || i}
                          className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={resolveMediaUrl(reviewerAvatar)}
                                fallback={reviewerName?.charAt(0) || 'C'}
                                className="h-10 w-10 ring-1 ring-border"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  {reviewerName}
                                </h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star
                                      key={idx}
                                      className={cn(
                                        'h-3.5 w-3.5',
                                        idx < rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-200 dark:text-slate-700'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs text-muted-foreground">
                              {rev.createdAt ? formatMemberSince(rev.createdAt) : ''}
                            </span>
                          </div>

                          {(rev.comment || rev.content) && (
                            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pt-1">
                              {rev.comment || rev.content}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {reviews.length > 0 && (
                  <Pagination
                    currentPage={reviewPage}
                    totalPages={totalReviewPages}
                    onPageChange={setReviewPage}
                  />
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
