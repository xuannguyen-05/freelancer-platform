import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BriefcaseBusiness, ImageOff, Star } from 'lucide-react'
import { gigService } from '../../services/gigService'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../ui'
import LandingDataState from './LandingDataState'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'
import { resolveMediaUrl } from '../../utils/media'
import { formatCurrency } from '../../utils/format'
import GigCard from '../common/GigCard'

export default function FeaturedGigsSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [sectionRef, sectionInView] = useInView()

  const handleGigClick = (gigId) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/app/gigs/${gigId}` } })
    } else {
      navigate(`/app/gigs/${gigId}`)
    }
  }

  const handleBrowseAll = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: '/app/home' } })
    } else {
      navigate('/app/home')
    }
  }

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const response = await gigService.getGigs({ page: 1, limit: 3 })
        setGigs(response.data?.data || [])
      } catch (requestError) {
        console.error('Failed to fetch gigs for landing:', requestError)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchGigs()
  }, [retryToken])

  return (
    <section className="border-y border-border/60 bg-background py-16 md:py-20">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn('landing-reveal mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between', sectionInView && 'is-visible')}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">{t('landing.featured.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{t('landing.featured.title')}</h2>
          </div>
          <button type="button" onClick={handleBrowseAll} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 cursor-pointer">
            {t('landing.featured.browseAll')} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading || error || gigs.length === 0 ? (
          <LandingDataState
            status={loading ? 'loading' : error ? 'error' : 'empty'}
            icon={BriefcaseBusiness}
            title={loading ? t('common.loading') : error ? t('landing.featured.errorTitle') : t('gig.noGigsFound')}
            description={error ? t('landing.featured.errorDescription') : t('landing.featured.empty')}
            actionLabel={error ? t('common.tryAgain') : undefined}
            onRetry={error ? () => {
              setError(false)
              setLoading(true)
              setRetryToken((token) => token + 1)
            } : undefined}
            count={3}
          />
        ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {gigs.slice(0, 3).map((gig, index) => (
            <div
              key={gig.id || gig._id}
              style={{ transitionDelay: sectionInView ? `${index * 80}ms` : undefined }}
              className={cn('landing-reveal flex flex-col', sectionInView && 'is-visible')}
            >
              <GigCard
                gig={gig}
                onClick={() => handleGigClick(gig.id || gig._id)}
                className="h-full hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 dark:hover:border-primary-700/50"
              />
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}
