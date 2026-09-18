import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  const { t } = useTranslation()
  const [sectionRef, sectionInView] = useInView()

  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-muted/40 py-20 md:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" aria-hidden />
      <div
        ref={sectionRef}
        className={cn(
          'landing-reveal mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8',
          sectionInView && 'is-visible'
        )}
      >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">Make the next move</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t('landing.finalCTA.headline')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t('landing.finalCTA.subheadline')}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link to="/app/gigs" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="landing-btn-lift w-full bg-primary-500 font-semibold shadow-sm hover:bg-primary-600 sm:w-auto"
            >
              {t('landing.finalCTA.clientCTA')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth/register" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="landing-btn-lift w-full border-border bg-card font-semibold hover:border-primary-200 hover:bg-primary-50/50 sm:w-auto"
            >
              {t('landing.finalCTA.freelancerCTA')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
