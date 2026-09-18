import { cn } from '../../utils/cn'

const badgeVariants = {
  variant: {
    default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-error-600 text-white hover:bg-error-700',
    outline: 'text-foreground',
    success: 'border-transparent bg-success-500 text-white hover:bg-success-600',
    warning: 'border-transparent bg-warning-500 text-white hover:bg-warning-600',
  },
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        badgeVariants.variant[variant],
        className
      )}
      {...props}
    />
  )
}
