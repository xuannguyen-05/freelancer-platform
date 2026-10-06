import { cn } from '../../utils/cn'

const badgeVariants = {
  variant: {
    // Workly primary solid (for primary action/selection)
    default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
    // Contextual Workly-blue emphasis (roles, categories, skills, packages, key metadata)
    emphasis: 'border-primary-200/70 dark:border-primary-800/70 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold',
    context: 'border-primary-200/60 dark:border-primary-800/60 bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium',
    pill: 'border-primary-200/60 dark:border-primary-800/60 bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium rounded-full',
    // Semantic Status Badges (separate from contextual blue)
    pending: 'border-amber-200/70 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold',
    inProgress: 'border-sky-200/70 dark:border-sky-800/70 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold',
    completed: 'border-emerald-200/70 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold',
    cancelled: 'border-rose-200/70 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold',
    secondary: 'border-slate-200/70 dark:border-slate-700/70 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium',
    outline: 'border-border text-foreground',
    destructive: 'border-transparent bg-error-600 text-white hover:bg-error-700',
    success: 'border-transparent bg-success-500 text-white hover:bg-success-600',
    warning: 'border-transparent bg-warning-500 text-white hover:bg-warning-600',
  },
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        badgeVariants.variant[variant] || badgeVariants.variant.default,
        className
      )}
      {...props}
    />
  )
}
