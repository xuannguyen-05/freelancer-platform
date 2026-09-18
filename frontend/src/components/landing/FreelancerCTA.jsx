import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { CheckCircle, Compass, MessageCircle } from 'lucide-react'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

export default function FreelancerCTA() {
  const { t } = useTranslation()
  const [sectionRef, sectionInView] = useInView()

  const benefits = [
    {
      icon: Compass,
      label: 'Reach clients looking for your expertise',
    },
    {
      icon: MessageCircle,
      label: 'Keep project conversations in one place',
    },
    {
      icon: CheckCircle,
      label: 'Build a profile around the work you do best',
    },
  ]

  return (
    <section className="bg-background py-20 md:py-24">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'landing-reveal mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] border border-primary-700/20 bg-linear-to-br from-primary-600 via-primary-600 to-primary-800 p-7 shadow-xl shadow-primary-900/15 md:p-11',
            sectionInView && 'is-visible'
          )}
        >
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-100">{t('landing.freelancerCTA.eyebrow')}</p>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                {t('landing.freelancerCTA.headline')}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-primary-100">
                {t('landing.freelancerCTA.subheadline')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link to="/auth/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="landing-btn-lift w-full bg-white font-semibold text-primary-600! shadow-sm hover:bg-primary-50 sm:w-auto"
                  >
                    {t('landing.freelancerCTA.primaryCTA')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {benefits.map((benefit) => {
                const IconComponent = benefit.icon
                return (
                  <div
                    key={benefit.label}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm transition-colors duration-200 hover:bg-white/15"
                  >
                    <IconComponent className="h-5 w-5 shrink-0 text-accent-300" />
                    <div className="text-sm font-medium leading-snug text-primary-50">{benefit.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
