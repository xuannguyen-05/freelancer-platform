import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Brand from '../components/common/Brand'
import { ArrowRight, Check, Sparkles } from 'lucide-react'

export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[44%] overflow-hidden bg-linear-to-br from-primary-700 via-primary-600 to-primary-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute -right-32 top-16 h-96 w-96 rounded-full bg-primary-300/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-accent-400/15 blur-3xl" aria-hidden="true" />
        <Brand size="md" className="relative [&_.workly-wordmark]:text-white [&_.workly-wordmark]:group-hover:text-white" />
        <div className="relative max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-100">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" />
            {t('auth.layout.eyebrow')}
          </div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white xl:text-5xl">
            {t('auth.layout.title')}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-primary-100/80">
            {t('auth.layout.description')}
          </p>
          <div className="mt-8 grid gap-3 text-sm text-primary-50">
            {[t('auth.layout.point1'), t('auth.layout.point2'), t('auth.layout.point3')].map((point) => (
              <div key={point} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/15 text-accent-300"><Check className="h-3.5 w-3.5" /></span>
                {point}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-primary-100/60">{t('auth.layout.footer')}</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:ml-[44%] lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-7 flex justify-center lg:hidden">
            <Brand size="lg" />
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-9 dark:shadow-black/20">
            <Outlet />
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="group inline-flex items-center gap-1.5 transition-colors hover:text-primary-600">
              <ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
              {t('common.back')} {t('nav.home')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
