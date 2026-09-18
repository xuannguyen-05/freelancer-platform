import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { categoryService } from '../../services/categoryService'
import LandingDataState from './LandingDataState'
import { useInView } from '../../hooks/useInView'
import {
  Code2,
  Smartphone,
  Palette,
  ChartNoAxesCombined,
  CloudCog,
  ShieldCheck,
  PenLine,
  Video,
  BriefcaseBusiness,
} from 'lucide-react'
import { cn } from '../../utils/cn'

const categoryIcons = {
  Development: Code2,
  'Web Development': Code2,
  'Mobile Apps': Smartphone,
  'Mobile Development': Smartphone,
  Design: Palette,
  'UI/UX Design': Palette,
  Data: ChartNoAxesCombined,
  'Data Science': ChartNoAxesCombined,
  DevOps: CloudCog,
  'DevOps & Cloud': CloudCog,
  Cybersecurity: ShieldCheck,
  Writing: PenLine,
  'Writing & Content': PenLine,
  Video: Video,
  'Video & Animation': Video,
  Business: BriefcaseBusiness,
  default: BriefcaseBusiness,
}

const ICON_CLASS = 'h-6 w-6 text-primary-600 stroke-[1.75] dark:text-primary-400'

export default function CategorySection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [sectionRef, sectionInView] = useInView()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories()
        const list = response.data?.data || []
        setCategories(list)
      } catch (requestError) {
        console.error('Failed to fetch categories:', requestError)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [retryToken])

  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName] || categoryIcons.default
  }

  return (
    <section id="categories" className="border-t border-border/60 bg-card py-20 md:py-24">
      <div ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'landing-reveal mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between',
            sectionInView && 'is-visible'
          )}
        >
          <div className="max-w-xl text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">{t('landing.categories.eyebrow')}</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t('landing.categories.title')}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
              {t('landing.categories.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/gigs')}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition-colors duration-200 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('landing.categories.viewAll')}
            <span aria-hidden>→</span>
          </button>
        </div>

        {loading || error || categories.length === 0 ? (
          <LandingDataState
            status={loading ? 'loading' : error ? 'error' : 'empty'}
            icon={BriefcaseBusiness}
            title={loading ? t('common.loading') : error ? t('landing.categories.errorTitle') : t('landing.categories.emptyTitle')}
            description={error ? t('landing.categories.errorDescription') : categories.length === 0 ? t('landing.categories.empty') : undefined}
            actionLabel={error ? t('common.tryAgain') : undefined}
            onRetry={error ? () => {
              setError(false)
              setLoading(true)
              setRetryToken((token) => token + 1)
            } : undefined}
            count={4}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {categories.map((category, index) => {
            const IconComponent = getCategoryIcon(category.name)
            return (
              <button
                key={category._id}
                type="button"
                onClick={() => navigate(`/app/gigs?category=${category._id}`)}
                style={{ transitionDelay: sectionInView ? `${index * 60}ms` : undefined }}
                className={cn(
                  'landing-reveal group flex min-h-30 flex-col items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition-all duration-300 ease-out',
                  'hover:-translate-y-0.5 hover:border-primary-300/80 hover:shadow-md hover:shadow-primary-500/10 dark:bg-card dark:hover:border-primary-600/40',
                  sectionInView && 'is-visible'
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 transition-colors duration-200 group-hover:bg-primary-100 dark:bg-primary-950/60 dark:group-hover:bg-primary-900/50">
                  <IconComponent className={ICON_CLASS} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">
                    {category.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground md:text-sm">
                    {category.description || t('landing.categories.subtitle')}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {t('landing.categories.servicesCount', { count: category.gigCount ?? 0 })}
                  </p>
                </div>
              </button>
            )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
