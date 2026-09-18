import { useTranslation } from 'react-i18next'
import { CircleCheck, MessageCircle, MousePointerClick, Search, ArrowRight } from 'lucide-react'
import { useInView } from '../../hooks/useInView'
import { cn } from '../../utils/cn'

export default function HowItWorksSection() {
  const { t } = useTranslation()
  const [sectionRef, sectionInView] = useInView()
  const steps = [
    { icon: Search, title: t('landing.howItWorks.step1.title'), description: t('landing.howItWorks.step1.description'), accent: 'primary' },
    { icon: MousePointerClick, title: t('landing.howItWorks.step2.title'), description: t('landing.howItWorks.step2.description'), accent: 'accent' },
    { icon: MessageCircle, title: t('landing.howItWorks.step3.title'), description: t('landing.howItWorks.step3.description'), accent: 'primary' },
    { icon: CircleCheck, title: t('landing.howItWorks.step4.title'), description: t('landing.howItWorks.step4.description'), accent: 'accent' },
  ]

  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/40 py-20 md:py-24">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn('landing-reveal mx-auto mb-14 max-w-2xl text-center md:mb-16', sectionInView && 'is-visible')}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">{t('landing.howItWorks.eyebrow')}</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('landing.howItWorks.title')}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t('landing.howItWorks.subtitle')}</p>
        </div>

        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-16 hidden h-px bg-linear-to-r from-primary-200 via-accent-300 to-primary-200 lg:block" aria-hidden />
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <article key={step.title} style={{ transitionDelay: sectionInView ? `${index * 80}ms` : undefined }} className={cn('landing-reveal relative rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/8', sectionInView && 'is-visible')}>
                <div className="relative z-10 mb-6 flex items-start justify-between">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', step.accent === 'accent' ? 'border-accent-200 bg-accent-50 text-accent-600' : 'border-primary-100 bg-primary-50 text-primary-600')}>
                    <IconComponent className="h-6 w-6 stroke-[1.75]" />
                  </div>
                  <span className="text-sm font-bold tabular-nums tracking-wider text-primary-400">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && <ArrowRight className="absolute -right-5 top-16 z-20 hidden h-4 w-4 text-primary-300 lg:block" />}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
