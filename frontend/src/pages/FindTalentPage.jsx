import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, UsersRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import LandingDataState from '../components/landing/LandingDataState'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'
import { gigService } from '../services/gigService'
import { resolveMediaUrl } from '../utils/media'

export default function FindTalentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(false)

    gigService.getGigs({ page: 1, limit: 30 })
      .then((res) => {
        if (!isMounted) return
        const gigs = res.data?.data || []
        const byId = new Map()

        gigs.forEach((gig) => {
          const f = gig.freelancer
          if (!f?.userID) return
          if (!byId.has(f.userID)) {
            byId.set(f.userID, {
              id: f.userID,
              name: f.name || 'Freelancer',
              avatar: f.avatar,
              categories: gig.category?.name ? [gig.category.name] : [],
              sampleGigId: gig.id || gig._id,
              sampleGigTitle: gig.title,
            })
          } else {
            const existing = byId.get(f.userID)
            if (gig.category?.name && !existing.categories.includes(gig.category.name)) {
              existing.categories.push(gig.category.name)
            }
          }
        })

        setFreelancers(Array.from(byId.values()))
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load talent:', err)
        setError(true)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [retryToken])

  const filteredFreelancers = freelancers.filter((f) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.categories.some((cat) => cat.toLowerCase().includes(q)) ||
      (f.sampleGigTitle && f.sampleGigTitle.toLowerCase().includes(q))
    )
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const PAGE_SIZE = 6
  const totalPages = Math.ceil(filteredFreelancers.length / PAGE_SIZE) || 1
  const paginatedFreelancers = filteredFreelancers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner / Search */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back button */}
          <div className="mb-4">
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

          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground min-h-[2.25rem]">
              <TypewriterText text={t('nav.findTalent', 'Find Talent')} speed={30} />
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground min-h-[1.75rem]">
              <TypewriterText
                text={t(
                  'findTalent.subtitle',
                  'Connect with vetted, top-rated freelance professionals for your project needs.'
                )}
                speed={16}
                delay={250}
              />
            </p>
          </div>

          <div className="mt-6 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search talent by name, skill, or service..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Talent Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Showing {filteredFreelancers.length} available talent
          </p>
        </div>

        {loading ? (
          <LandingDataState status="loading" count={6} />
        ) : error ? (
          <LandingDataState
            status="error"
            icon={UsersRound}
            title="Unable to load talent"
            description="We encountered an issue fetching talent profiles. Please try again."
            actionLabel={t('common.tryAgain', 'Try Again')}
            onRetry={() => setRetryToken((t) => t + 1)}
          />
        ) : filteredFreelancers.length === 0 ? (
          <LandingDataState
            status="empty"
            icon={UsersRound}
            title="No talent found"
            description="No freelancers match your search query. Try searching with different keywords."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedFreelancers.map((talent) => (
              <div
                key={talent.id}
                onClick={() => navigate(`/app/freelancers/${talent.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 cursor-pointer"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={resolveMediaUrl(talent.avatar)}
                      alt={talent.name}
                      fallback={talent.name.charAt(0)}
                      className="h-14 w-14 bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300 ring-2 ring-border shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary-600 transition-colors">
                          {talent.name}
                        </h3>
                        <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t('landing.freelancers.serviceProvider', 'Workly Verified Professional')}</p>

                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>5.0</span>
                        <span className="text-muted-foreground font-normal">(Top Rated)</span>
                      </div>
                    </div>
                  </div>

                  {talent.categories.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {talent.categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full border border-primary-200/70 dark:border-primary-800/70 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {talent.sampleGigTitle && (
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      <span className="font-semibold text-foreground">{t('home.featuredService', 'Featured service:')}</span> {talent.sampleGigTitle}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/app/freelancers/${talent.id}`)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-1.5 text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                  >
                    {t('home.viewProfile', 'View Profile')} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredFreelancers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  )
}
