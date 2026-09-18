import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui'
import { ArrowRight, BadgeCheck, Search, Sparkles, Users } from 'lucide-react'

export default function HeroSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(searchQuery.trim() ? `/app/gigs?search=${encodeURIComponent(searchQuery)}` : '/app/gigs')
  }

  return (
    <section className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(59,130,246,0.08),transparent_42%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_65%,rgba(59,130,246,0.1),transparent_40%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-900/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-800/25"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-14">
        <div className="max-w-2xl">
          <div className="landing-hero-enter mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t('landing.featured.eyebrow')}
          </div>
          <h1 className="landing-hero-enter text-balance text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.5rem]">
            {t('landing.hero.headline')}
          </h1>

          <p className="landing-hero-enter landing-hero-enter-delay-1 mt-6 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            {t('landing.hero.subheadline')}
          </p>

          <form onSubmit={handleSearch} className="landing-hero-enter landing-hero-enter-delay-2 mt-9 max-w-2xl">
            <div className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-slate-900/6 transition duration-300 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10 sm:flex-row sm:items-center sm:gap-0">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground stroke-[1.75]" />
                <input type="text" placeholder={t('landing.hero.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 w-full rounded-xl border-0 bg-transparent pl-12 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 sm:h-14" />
              </div>
              <Button type="submit" size="lg" className="landing-btn-lift h-12 w-full shrink-0 rounded-xl bg-primary-500 px-6 font-semibold shadow-sm hover:bg-primary-600 sm:h-12 sm:w-auto">
                {t('landing.hero.searchButton')}
                <ArrowRight className="ml-2 h-4 w-4 stroke-2" />
              </Button>
            </div>
          </form>

          <div className="landing-hero-enter landing-hero-enter-delay-3 mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{t('landing.hero.popularLabel')}</span>
            {['Web App', 'UI/UX Design', 'Mobile App', 'Data Science', 'DevOps'].map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => navigate(`/app/gigs?search=${encodeURIComponent(suggestion)}`)} className="rounded-lg border border-border bg-card px-2.5 py-1.5 font-medium transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600">
                {suggestion}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary-500" /> Vetted talent</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary-500" /> Global community</span>
          </div>
        </div>

        <div className="landing-hero-enter landing-hero-enter-delay-2 relative mx-auto w-full max-w-lg lg:justify-self-end">
          <div className="absolute -inset-4 rounded-4xl bg-primary-500/10 blur-2xl" aria-hidden />
          <div className="relative rounded-[1.75rem] border border-border/80 bg-card/95 p-4 shadow-2xl shadow-primary-900/10 backdrop-blur sm:p-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('landing.hero.previewEyebrow')}</p><p className="mt-1 font-bold text-foreground">{t('landing.hero.previewTitle')}</p></div>
              <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700 dark:bg-accent-950/50 dark:text-accent-300">{t('landing.hero.previewBadge')}</span>
            </div>
            <div className="mt-4 space-y-3">
              {['Discover relevant services', 'Compare your options', 'Collaborate with confidence'].map((title, index) => (
                <div key={title} className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${index === 1 ? 'bg-accent-100 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300'}`}>0{index + 1}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{t('landing.hero.previewDetail')}</p></div>
                  <ArrowRight className="h-4 w-4 text-primary-500" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-50 px-3.5 py-3 dark:bg-primary-950/50"><span className="text-xs font-medium text-primary-700 dark:text-primary-300">{t('landing.hero.previewFooter')}</span><ArrowRight className="h-4 w-4 text-primary-600" /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
