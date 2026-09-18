import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BriefcaseBusiness, ImageOff } from 'lucide-react'
import { gigService } from '../../services/gigService'
import { Avatar } from '../ui'
import LandingDataState from './LandingDataState'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

export default function FeaturedGigsSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [sectionRef, sectionInView] = useInView()

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
          <button type="button" onClick={() => navigate('/app/gigs')} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400">
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
            <article key={gig.id} style={{ transitionDelay: sectionInView ? `${index * 80}ms` : undefined }} className={cn('landing-reveal group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 ease-out', 'hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 dark:hover:border-primary-700/50', sectionInView && 'is-visible')}>
              <button type="button" onClick={() => navigate(`/app/gigs/${gig.id}`)} className="block w-full text-left">
                <div className="relative aspect-16/10 overflow-hidden bg-muted">
                  {gig.img_url ? <img src={gig.img_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <div className="grid h-full place-items-center bg-primary-50 text-primary-300 dark:bg-primary-950/40"><ImageOff className="h-8 w-8" /></div>}
                  <span className="absolute left-3 top-3 rounded-md bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">{gig.category?.name || t('landing.categories.title')}</span>
                </div>
                <div className="space-y-3 p-4 md:p-5">
                  <div className="flex items-center gap-2.5"><Avatar src={gig.freelancer?.avatar} fallback={gig.freelancer?.name?.charAt(0) || 'F'} className="h-8 w-8" /><span className="text-sm font-medium text-muted-foreground">{gig.freelancer?.name}</span></div>
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">{gig.title}</h3>
                  <div className="flex items-center justify-between border-t border-border/80 pt-3 text-sm"><span className="text-muted-foreground">{t('landing.featured.discoverService')}</span><ArrowRight className="h-4 w-4 text-primary-500 transition-transform group-hover:translate-x-1" /></div>
                </div>
              </button>
            </article>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}
