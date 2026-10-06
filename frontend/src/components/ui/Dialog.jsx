import { cn } from '../../utils/cn'
import { X } from 'lucide-react'

export function Dialog({ open, onClose, children, className }) {
  if (!open) return null

  const hasCustomMaxW = Boolean(className && /\bmax-w-/.test(className))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-50 w-full rounded-2xl border border-border bg-background shadow-2xl transition-all',
          !hasCustomMaxW && 'max-w-lg p-6',
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-20 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({ className, children, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  )
}

export function DialogFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}
