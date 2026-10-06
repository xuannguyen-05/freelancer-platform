import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Star,
  Clock,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Check,
  User,
  ExternalLink,
  Loader2,
  Layers,
  Edit2
} from 'lucide-react'
import { Avatar, Button, Dialog } from '../components/ui'
import GigFormModal from '../components/gigs/GigFormModal'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { gigService } from '../services/gigService'
import { orderService } from '../services/orderService'
import { reviewService } from '../services/reviewService'
import { formatCurrency } from '../utils/format'
import { resolveMediaUrl } from '../utils/media'
import { getErrorMessage } from '../utils/apiError'
import { cn } from '../utils/cn'

export default function GigDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  // Data states
  const [gig, setGig] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imgError, setImgError] = useState(false)

  // Interactive states
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0)

  // Order modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [orderSuccess, setOrderSuccess] = useState(null)

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch gig details and reviews
  const fetchGigData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await gigService.getGigById(id)
      const gigData = res.data || res
      setGig(gigData)

      // Fetch reviews strictly for THIS specific gig
      try {
        const revRes = await reviewService.getReviewsByGig(id)
        setReviews(revRes.data || revRes || [])
      } catch (revErr) {
        console.warn('Failed to load gig reviews:', revErr)
      }
    } catch (err) {
      console.error('Error loading gig:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load gig details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGigData()
  }, [fetchGigData])

  // Current selected package
  const packages = useMemo(() => {
    if (!gig?.packages || gig.packages.length === 0) {
      return [{
        packageID: 'default',
        title: t('gig.standard', 'Standard'),
        description: gig?.description || '',
        price: gig?.price || 0,
        deliveryDay: 3,
        revision: 2,
      }]
    }
    return gig.packages
  }, [gig, t])

  const selectedPackage = packages[selectedPackageIndex] || packages[0]

  // Extract features from package description
  const packageFeatures = useMemo(() => {
    if (!selectedPackage) return []
    if (selectedPackage.description && selectedPackage.description.includes('\n')) {
      return selectedPackage.description
        .split('\n')
        .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
        .filter(Boolean)
    }
    return [
      t('gig.deliveryDaysCount', { count: selectedPackage.deliveryDay || 3 }),
      selectedPackage.revision > 0
        ? t('gig.revisionsCount', { count: selectedPackage.revision })
        : t('gig.unlimitedRevisions', 'Unlimited revisions'),
      t('gig.messagingIncluded', 'Messaging included'),
      selectedPackage.description || t('gig.packageFeatures', 'Service delivery as described')
    ]
  }, [selectedPackage, t])

  // Pricing calculations for order modal (10% service fee)
  const packagePrice = selectedPackage?.price || 0
  const serviceFee = Math.round(packagePrice * 0.1)
  const totalAmount = packagePrice + serviceFee

  // Handle proceed to order
  const handleContinue = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/app/gigs/${id}` } })
      return
    }
    if (user?.role === 'freelancer') {
      toast.error(t('gig.freelancerCannotOrderDesc', 'Only Buyer accounts can place orders. Freelancer accounts cannot purchase services.'))
      return
    }
    if (user?.role === 'admin') {
      toast.error(t('gig.adminCannotOrder', 'Admin accounts cannot place orders.'))
      return
    }
    setOrderError(null)
    setOrderSuccess(null)
    setIsOrderModalOpen(true)
  }

  // Handle confirm order
  const handleConfirmOrder = async () => {
    if (!selectedPackage) return
    if (user?.role !== 'buyer') {
      setOrderError(t('gig.freelancerCannotOrderDesc', 'Only Buyer accounts can place orders.'))
      return
    }
    setIsOrdering(true)
    setOrderError(null)

    try {
      const res = await orderService.createOrder({
        packageID: selectedPackage.packageID || selectedPackage._id
      })
      setOrderSuccess(res.data || res)
    } catch (err) {
      console.error('Order creation error:', err)
      setOrderError(getErrorMessage(err, t))
    } finally {
      setIsOrdering(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {t('common.loading', 'Loading service details...')}
        </p>
      </div>
    )
  }

  // Error state
  if (error || !gig) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-card border border-border rounded-2xl text-center shadow-xs">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('gig.gigDetails', 'Service Details')}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{error || 'Gig not found'}</p>
        <Button onClick={() => navigate('/app/home')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back to Marketplace')}
        </Button>
      </div>
    )
  }

  const formatYear = (dateStr) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).getFullYear()
    } catch {
      return null
    }
  }

  const categoryName = gig.category?.name || (typeof gig.category === 'string' ? gig.category : '')
  const freelancerData = gig.freelancer || {}
  const freelancerId = gig.freelancerID || freelancerData.userID || freelancerData.id
  const freelancerName = freelancerData.name || t('landing.freelancers.serviceProvider', 'Workly Professional')
  const freelancerAvatar = freelancerData.avatar || ''
  const freelancerBio = freelancerData.bio || freelancerData.description || ''
  const freelancerLocation = freelancerData.location || ''
  const freelancerCreatedAt = freelancerData.createdAt
  const freelancerResponseTime = freelancerData.responseTime || ''
  const freelancerCompletionRate = freelancerData.completionRate != null ? freelancerData.completionRate : null
  const freelancerSkills = freelancerData.skills || freelancerData.skillNames || []
  const freelancerReviewCount = freelancerData.reviewCount ?? 0
  const freelancerRating = freelancerReviewCount > 0 && freelancerData.rating > 0 ? Number(freelancerData.rating).toFixed(1) : (freelancerReviewCount > 0 ? '5.0' : '0')

  const reviewCountValue = reviews.length
  const hasReviews = reviewCountValue > 0
  const ratingValue = hasReviews
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : (gig.reviewCount > 0 && gig.rating > 0 ? Number(gig.rating).toFixed(1) : '0')

  const currentUserId = user?._id || user?.id
  const gigFreelancerId = gig.freelancerID || freelancerData.userID || freelancerData.id || freelancerData._id
  const isOwner = Boolean(currentUserId && gigFreelancerId && String(currentUserId) === String(gigFreelancerId))

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* 1. Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
          <Link
            to="/app/home"
            className="hover:text-foreground transition-colors font-medium"
          >
            {t('gig.browse', 'Browse')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          {categoryName ? (
            <Link
              to={`/app/home?category=${encodeURIComponent(categoryName)}`}
              className="hover:text-primary-600 transition-colors font-medium text-foreground"
            >
              {categoryName}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{t('gig.title', 'Service')}</span>
          )}
        </nav>

        {/* 2. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN (Content, Media & Details) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
            
            {/* Title & Seller Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight flex-1">
                  {gig.title}
                </h1>
                {isOwner && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="rounded-xl text-xs font-semibold gap-2 border-primary-300 dark:border-primary-700 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 shrink-0 self-start"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('gig.editGig', 'Chỉnh sửa dịch vụ')}
                  </Button>
                )}
              </div>

              {/* Seller / Rating / Category Bar */}
              <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 pt-2 pb-1 border-b border-border/60 text-sm">
                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => {
                    const fId = gig.freelancerID || gig.freelancer?.userID || gig.freelancer?.id
                    if (fId) navigate(`/app/freelancers/${fId}`)
                  }}
                >
                  <Avatar
                    src={resolveMediaUrl(freelancerAvatar)}
                    fallback={freelancerName?.charAt(0) || 'F'}
                    className="h-9 w-9 ring-1 ring-border group-hover:ring-primary-500 transition-all"
                  />
                  <span className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {freelancerName}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    <Star className={cn("h-4 w-4 shrink-0", hasReviews ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                  </div>
                  <span className="font-bold text-foreground">{ratingValue}</span>
                  <span className="text-muted-foreground font-normal">({reviewCountValue})</span>
                </div>

                {/* Category Badge Pill */}
                {categoryName && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    {categoryName}
                  </span>
                )}
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-slate-100 dark:bg-slate-900 aspect-video shadow-xs">
              {gig.img_url && !imgError ? (
                <img
                  src={resolveMediaUrl(gig.img_url)}
                  alt={gig.title}
                  className="w-full h-full object-cover object-center transition-opacity duration-300"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6 bg-gradient-to-br from-primary-50/40 to-muted dark:from-primary-950/20 dark:to-card">
                  <Layers className="h-14 w-14 text-primary-400/60 mb-2" />
                  <span className="text-sm font-medium text-foreground/80">{gig.title}</span>
                </div>
              )}
            </div>

            {/* Navigation Tabs Bar */}
            <div className="border-b border-border flex items-center gap-6 sm:gap-8 overflow-x-auto select-none">
              {[
                { id: 'overview', label: t('gig.overview', 'Overview') },
                { id: 'packages', label: t('gig.packages', 'Packages') },
                { id: 'reviews', label: `${t('gig.reviewsTab', 'Reviews')} (${reviewCountValue})` },
                { id: 'about', label: t('gig.aboutFreelancer', 'About freelancer') }
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'pb-3 text-sm sm:text-base font-semibold transition-colors relative cursor-pointer whitespace-nowrap',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 -mb-[1px]'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENTS */}
            <div className="pt-2">
              {/* 1. Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">
                      {t('gig.overview', 'About this service')}
                    </h3>
                    <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                      {gig.description || t('gig.noDescription', 'No detailed description provided.')}
                    </div>
                  </div>

                  {/* Skills / Tags chips */}
                  {gig.tags && gig.tags.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Tags & Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {gig.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Packages Tab */}
              {activeTab === 'packages' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {t('gig.packages', 'Compare Packages')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg, idx) => {
                      const isSelected = selectedPackageIndex === idx
                      return (
                        <div
                          key={pkg.packageID || idx}
                          onClick={() => setSelectedPackageIndex(idx)}
                          className={cn(
                            'rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer',
                            isSelected
                              ? 'border-primary-600 ring-2 ring-primary-600/10 bg-primary-50/20 dark:bg-primary-950/20'
                              : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700'
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h4 className="font-bold text-base text-foreground">
                                {pkg.title}
                              </h4>
                              {isSelected && (
                                <span className="p-1 rounded-full bg-primary-600 text-white">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-black text-foreground mb-3">
                              {formatCurrency(pkg.price)}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                              {pkg.description || t('gig.packageFeatures', 'Standard service package')}
                            </p>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-border text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary-500" />
                              <span>{t('gig.deliveryDaysCount', { count: pkg.deliveryDay || 3 })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 text-primary-500" />
                              <span>
                                {pkg.revision > 0
                                  ? t('gig.revisionsCount', { count: pkg.revision })
                                  : t('gig.unlimitedRevisions', 'Unlimited revisions')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 3. Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating Breakdown Header */}
                  <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center sm:text-left">
                      <div className="text-4xl font-extrabold text-foreground">
                        {ratingValue}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-1 my-1.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('gig.reviewsTab', 'Reviews')} ({reviewCountValue})
                      </p>
                    </div>
                  </div>

                  {/* Review List */}
                  {reviews.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium">{t('gig.noReviews', 'No reviews yet for this service.')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => (
                        <div
                          key={rev._id || rev.id}
                          className="p-5 rounded-2xl border border-border bg-card space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={rev.reviewer?.avatar}
                                fallback={rev.reviewer?.name?.charAt(0) || 'U'}
                                className="h-9 w-9"
                              />
                              <div>
                                <h5 className="text-sm font-bold text-foreground">
                                  {rev.reviewer?.name || 'Customer'}
                                </h5>
                                <div className="flex items-center gap-1 text-amber-500 text-xs mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        'h-3 w-3',
                                        i < rev.rating
                                          ? 'fill-amber-500 text-amber-500'
                                          : 'text-slate-300 dark:text-slate-700'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            {rev.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {rev.comment && (
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. About Freelancer Tab (Matching Reference Image 4) */}
              {activeTab === 'about' && (
                <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card">
                  <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                    
                    {/* Left Column: Avatar, Name, Rating, View profile button */}
                    <div className="flex flex-col items-center text-center sm:items-start sm:text-left shrink-0 w-full sm:w-44">
                      <Avatar
                        src={resolveMediaUrl(freelancerAvatar)}
                        fallback={freelancerName?.charAt(0) || 'F'}
                        className="h-20 w-20 rounded-full ring-2 ring-border shadow-xs"
                      />

                      <h4 className="text-base sm:text-lg font-bold text-foreground mt-3 leading-snug">
                        {freelancerName}
                      </h4>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mt-1 inline-block">
                        {t('orderDetail.freelancer', 'Freelancer')}
                      </span>

                      {/* Stars and Rating */}
                      <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3.5 w-3.5',
                                freelancerReviewCount > 0 && i < Math.round(Number(freelancerRating))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-700'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-foreground font-bold ml-1">{freelancerRating}</span>
                        <span className="text-muted-foreground font-normal">({freelancerReviewCount})</span>
                      </div>

                      {/* View Profile Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (freelancerId) navigate(`/app/freelancers/${freelancerId}`)
                        }}
                        className="mt-4 rounded-xl text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors w-full sm:w-auto cursor-pointer"
                      >
                        {t('gig.viewProfileBtn', 'View profile')}
                      </Button>
                    </div>

                    {/* Right Column: Bio, Meta Grid, Skills */}
                    <div className="flex-1 min-w-0 space-y-4 pt-1 sm:pt-0">
                      
                      {/* Bio (Only show if exists) */}
                      {freelancerBio && (
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                          {freelancerBio}
                        </p>
                      )}

                      {/* Metadata Grid (Location, Member since, Response time, Completion) - Only render available items */}
                      {(freelancerLocation || freelancerCreatedAt || freelancerResponseTime || freelancerCompletionRate != null) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs sm:text-sm pt-2">
                          {freelancerLocation ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-muted-foreground font-medium">{t('gig.location', 'Location')}:</span>
                              <span className="font-semibold text-foreground">{freelancerLocation}</span>
                            </div>
                          ) : null}

                          {freelancerCreatedAt ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-muted-foreground font-medium">{t('gig.memberSince', 'Member since')}:</span>
                              <span className="font-semibold text-foreground">{formatYear(freelancerCreatedAt)}</span>
                            </div>
                          ) : null}

                          {freelancerResponseTime ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-muted-foreground font-medium">{t('gig.responseTime', 'Response time')}:</span>
                              <span className="font-semibold text-foreground">{freelancerResponseTime}</span>
                            </div>
                          ) : null}

                          {freelancerCompletionRate != null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-muted-foreground font-medium">{t('gig.completion', 'Completion')}:</span>
                              <span className="font-semibold text-foreground">{freelancerCompletionRate}%</span>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Skill tags (Only show if skills exist) */}
                      {freelancerSkills && freelancerSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {freelancerSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70"
                            >
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Sticky Package Selector Sidebar matching reference) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-5">
            
            {/* Package Card Box */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              
              {/* Package Tier Tabs Header */}
              {packages.length > 1 ? (
                <div className="grid grid-flow-col auto-cols-fr bg-muted/40 border-b border-border p-1 gap-1">
                  {packages.map((pkg, idx) => {
                    const isSelected = selectedPackageIndex === idx
                    return (
                      <button
                        key={pkg.packageID || idx}
                        type="button"
                        onClick={() => setSelectedPackageIndex(idx)}
                        className={cn(
                          'py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer truncate',
                          isSelected
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        {pkg.title}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-6 pt-5 pb-1 border-b border-border/40 font-semibold text-xs tracking-wider text-muted-foreground uppercase">
                  {selectedPackage.title}
                </div>
              )}

              {/* Package Details Body */}
              <div className="p-6 space-y-5">
                
                {/* Package Name & Big Price */}
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground truncate">
                    {selectedPackage.title}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground shrink-0">
                    {formatCurrency(packagePrice)}
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {selectedPackage.description || t('gig.packageFeatures', 'Complete professional service package.')}
                </p>

                {/* Delivery Time & Revisions Row */}
                <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-foreground py-2 border-y border-border/60">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-500 shrink-0" />
                    <span>{t('gig.deliveryDaysCount', { count: selectedPackage.deliveryDay || 3 })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary-500 shrink-0" />
                    <span>
                      {selectedPackage.revision > 0
                        ? t('gig.revisionsCount', { count: selectedPackage.revision })
                        : t('gig.unlimitedRevisions', 'Unlimited revisions')}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 pt-1">
                  {packageFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Big Action CTA Button */}
                {isOwner ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-700 dark:text-primary-300">
                      <p className="font-semibold">{t('gig.ownerNotice', 'Dịch vụ của bạn')}</p>
                      <p className="mt-0.5 opacity-90">{t('gig.ownerNoticeDesc', 'Bạn là chủ sở hữu của dịch vụ này. Bạn có thể chỉnh sửa thông tin bất cứ lúc nào.')}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full py-3.5 text-sm sm:text-base font-bold rounded-xl shadow-md transition-all duration-200 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('gig.editGig', 'Chỉnh sửa dịch vụ')}
                    </Button>
                  </div>
                ) : user?.role === 'freelancer' ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        {t('gig.freelancerNoticeTitle', 'Tài khoản Freelancer')}
                      </p>
                      <p className="mt-1 opacity-90">
                        {t('gig.freelancerCannotOrderDesc', 'Chỉ tài khoản Khách hàng (Buyer) mới có thể đặt dịch vụ. Tài khoản Freelancer không thể mua dịch vụ.')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      disabled
                      className="w-full py-3.5 text-sm sm:text-base font-bold rounded-xl bg-muted text-muted-foreground cursor-not-allowed opacity-75"
                    >
                      {t('gig.onlyBuyersCanOrder', 'Chỉ Khách hàng mới có thể đặt dịch vụ')}
                    </Button>
                  </div>
                ) : user?.role === 'admin' ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground">
                      <p className="font-semibold">{t('gig.adminCannotOrder', 'Tài khoản Quản trị viên không thể đặt dịch vụ.')}</p>
                    </div>
                    <Button
                      type="button"
                      disabled
                      className="w-full py-3.5 text-sm sm:text-base font-bold rounded-xl bg-muted text-muted-foreground cursor-not-allowed opacity-75"
                    >
                      {t('gig.onlyBuyersCanOrder', 'Chỉ Khách hàng mới có thể đặt dịch vụ')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleContinue}
                    className="w-full py-3.5 text-sm sm:text-base font-bold rounded-xl shadow-md transition-all duration-200 bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    {t('gig.continueWithPrice', { price: formatCurrency(packagePrice) })}
                  </Button>
                )}

                {/* Trust & Guarantee Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{t('gig.secure', 'Secure')}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
                    <span>{t('gig.messagingIncluded', 'Messaging included')}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Seller Mini Profile Card below package card */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                onClick={() => {
                  const fId = gig.freelancerID || gig.freelancer?.userID || gig.freelancer?.id
                  if (fId) navigate(`/app/freelancers/${fId}`)
                }}
              >
                <Avatar
                  src={resolveMediaUrl(freelancerAvatar)}
                  fallback={freelancerName?.charAt(0) || 'F'}
                  className="h-11 w-11 shrink-0 ring-1 ring-border group-hover:ring-primary-500 transition-all"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary-600 transition-colors truncate">
                    {freelancerName}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {t('landing.freelancers.serviceProvider', 'Workly Professional')}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fId = gig.freelancerID || gig.freelancer?.userID || gig.freelancer?.id
                  if (fId) navigate(`/app/freelancers/${fId}`)
                }}
                className="shrink-0 text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors"
              >
                {t('gig.profile', 'Profile')}
              </Button>
            </div>

          </div>

        </div>
      </div>

      {/* 3. ORDER CONFIRMATION MODAL (Production-Grade) */}
      <Dialog
        open={isOrderModalOpen}
        onClose={() => {
          if (!isOrdering) {
            setIsOrderModalOpen(false)
            setOrderSuccess(null)
            setOrderError(null)
          }
        }}
        className="max-w-md p-6 rounded-3xl"
      >
        {orderSuccess ? (
          /* SUCCESS STATE */
          <div className="text-center py-4 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {t('gig.orderSuccess', 'Order placed successfully!')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                {t('gig.orderSuccessDesc', 'Your order has been created and is now pending with the freelancer.')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border text-left space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('gig.title', 'Service')}:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">{gig.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('gig.packages', 'Package')}:</span>
                <span className="font-medium text-foreground">{selectedPackage.title}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('gig.total', 'Total')}:</span>
                <span className="font-bold text-foreground text-sm">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => navigate('/app/orders')}
                className="w-full font-semibold"
              >
                {t('gig.viewOrders', 'View Orders')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsOrderModalOpen(false)
                  setOrderSuccess(null)
                }}
                className="w-full text-xs text-muted-foreground"
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        ) : (
          /* CONFIRMATION STATE */
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t('gig.confirmOrder', 'Confirm Order')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('gig.orderSummary', 'Review order details before proceeding')}
                </p>
              </div>
            </div>

            {/* Error message */}
            {orderError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{orderError}</span>
                </div>
                {(orderError.toLowerCase().includes('token') ||
                  orderError.toLowerCase().includes('unauthorized') ||
                  orderError.toLowerCase().includes('expired') ||
                  orderError.toLowerCase().includes('log in')) && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate('/auth/login')}
                      className="w-full text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-xs"
                    >
                      {t('common.loginAgain', 'Log in again')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Service & Package summary card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedPackage.title}
              </div>
              <h4 className="text-sm font-bold text-foreground leading-snug">
                {gig.title}
              </h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary-500" />
                  {t('gig.deliveryDaysCount', { count: selectedPackage.deliveryDay || 3 })}
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5 text-primary-500" />
                  {selectedPackage.revision > 0
                    ? t('gig.revisionsCount', { count: selectedPackage.revision })
                    : t('gig.unlimitedRevisions', 'Unlimited revisions')}
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-xs sm:text-sm pt-1">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('gig.price', 'Package price')}</span>
                <span className="font-medium text-foreground">{formatCurrency(packagePrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('gig.serviceFee', 'Service fee (10%)')}</span>
                <span className="font-medium text-foreground">{formatCurrency(serviceFee)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="font-bold text-foreground text-sm">{t('gig.total', 'Total')}</span>
                <span className="font-black text-foreground text-lg sm:text-xl text-primary-600 dark:text-primary-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Secure Payment Notice */}
            <div className="p-3 rounded-xl bg-primary-50/60 dark:bg-primary-950/40 border border-primary-200/50 dark:border-primary-800/40 text-[11px] text-primary-800 dark:text-primary-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400 mt-0.5" />
              <p className="leading-relaxed">
                {t('gig.securePaymentNotice', t('gig.escrowNotice', 'Thanh toán an toàn 100%: Giao dịch được bảo vệ và xử lý an toàn trên Workly.'))}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isOrdering}
                onClick={() => setIsOrderModalOpen(false)}
                className="text-xs font-semibold"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="button"
                disabled={isOrdering}
                onClick={handleConfirmOrder}
                className="gap-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white min-w-[130px]"
              >
                {isOrdering ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t('gig.placingOrder', 'Placing order...')}</span>
                  </>
                ) : (
                  <span>{t('gig.confirmOrder', 'Confirm Order')}</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit Gig Modal */}
      <GigFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          fetchGigData()
        }}
        gig={gig}
      />
    </div>
  )
}
