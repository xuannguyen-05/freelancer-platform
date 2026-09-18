import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, UsersRound } from 'lucide-react'
import { gigService } from '../../services/gigService'
import { Avatar } from '../ui'
import LandingDataState from './LandingDataState'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

export default function FeaturedFreelancersSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [sectionRef, sectionInView] = useInView()

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const response = await gigService.getGigs({ page: 1, limit: 12 })
        const gigs = response.data?.data || []
        const byId = new Map()

        gigs.forEach((gig) => {
          const freelancer = gig.freelancer
          if (!freelancer?.userID || byId.has(freelancer.userID)) return
          byId.set(freelancer.userID, {
            id: freelancer.userID,
            name: freelancer.name,
            avatar: freelancer.avatar,
            categories: gig.category?.name ? [gig.category.name] : [],
          })
        })

        setFreelancers(Array.from(byId.values()).slice(0, 4))
      } catch (requestError) {
        console.error('Failed to fetch freelancers for landing:', requestError)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchFreelancers()
  }, [retryToken])

  return (
    <section className="border-y border-border/60 bg-card py-20 md:py-24">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn('landing-reveal mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between', sectionInView && 'is-visible')}>
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">{t('landing.freelancers.eyebrow')}</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('landing.freelancers.title')}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{t('landing.freelancers.subtitle')}</p>
          </div>
          <button type="button" onClick={() => navigate('/app/gigs')} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400">{t('landing.freelancers.action')} <ArrowRight className="h-4 w-4" /></button>
        </div>

        {loading || error || freelancers.length === 0 ? (
          <LandingDataState
            status={loading ? 'loading' : error ? 'error' : 'empty'}
            icon={UsersRound}
            title={loading ? t('common.loading') : error ? t('landing.freelancers.errorTitle') : t('landing.freelancers.emptyTitle')}
            description={error ? t('landing.freelancers.errorDescription') : t('landing.freelancers.emptyDescription')}
            actionLabel={error ? t('common.tryAgain') : undefined}
            onRetry={error ? () => {
              setError(false)
              setLoading(true)
              setRetryToken((token) => token + 1)
            } : undefined}
            count={4}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {freelancers.map((freelancer, index) => (
              <article key={freelancer.id} style={{ transitionDelay: sectionInView ? `${index * 70}ms` : undefined }} className={cn('landing-reveal rounded-2xl border border-border bg-background p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/8', sectionInView && 'is-visible')}>
                <Avatar src={freelancer.avatar} alt={freelancer.name} fallback={freelancer.name?.charAt(0) || 'F'} className="h-14 w-14 bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300" />
                <h3 className="mt-4 text-base font-bold text-foreground">{freelancer.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('landing.freelancers.serviceProvider')}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {freelancer.categories.map((category) => <span key={category} className="rounded-md border border-primary-100 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 dark:border-primary-900 dark:bg-primary-950/50 dark:text-primary-300">{category}</span>)}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
