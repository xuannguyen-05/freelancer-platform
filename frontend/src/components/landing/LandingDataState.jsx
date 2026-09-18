import { ArrowRight, RefreshCw } from 'lucide-react'
import { LoadingSkeleton } from '../ui'

export default function LandingDataState({
  status,
  icon: Icon,
  title,
  description,
  onRetry,
  actionLabel,
  count = 3,
}) {
  if (status === 'loading') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <LoadingSkeleton className="h-32 w-full rounded-xl" />
            <LoadingSkeleton className="mt-4 h-4 w-2/3" />
            <LoadingSkeleton className="mt-3 h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center shadow-sm">
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${status === 'error' ? 'bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-300' : 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300'}`}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {status === 'error' && onRetry && (
        <button type="button" onClick={onRetry} className="landing-btn-lift mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
          <RefreshCw className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
      {status === 'empty' && actionLabel && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </div>
  )
}
