import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (safeCurrentPage > 3) {
        pages.push('...')
      }
      const start = Math.max(2, safeCurrentPage - 1)
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      if (safeCurrentPage < safeTotalPages - 2) {
        pages.push('...')
      }
      if (!pages.includes(safeTotalPages)) {
        pages.push(safeTotalPages)
      }
    }
    return pages
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'mt-8 sm:mt-10 flex items-center justify-center gap-1.5 sm:gap-2 select-none',
        className
      )}
    >
      {/* Previous Page Button */}
      <button
        type="button"
        onClick={() => onPageChange && onPageChange(Math.max(safeCurrentPage - 1, 1))}
        disabled={safeCurrentPage <= 1}
        aria-label="Previous page"
        className={cn(
          'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-border text-sm font-medium transition-all shadow-xs',
          safeCurrentPage <= 1
            ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
            : 'bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border cursor-pointer'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((item, idx) => {
        if (item === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 w-8 sm:h-10 sm:w-9 items-center justify-center text-sm font-medium text-muted-foreground"
            >
              ...
            </span>
          )
        }

        const pageNum = Number(item)
        const isActive = pageNum === safeCurrentPage

        return (
          <button
            key={`page-${pageNum}`}
            type="button"
            onClick={() => onPageChange && onPageChange(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer border',
              isActive
                ? 'border-primary-600 bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                : 'border-slate-200/90 dark:border-border bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border'
            )}
          >
            {pageNum}
          </button>
        )
      })}

      {/* Next Page Button */}
      <button
        type="button"
        onClick={() => onPageChange && onPageChange(Math.min(safeCurrentPage + 1, safeTotalPages))}
        disabled={safeCurrentPage >= safeTotalPages}
        aria-label="Next page"
        className={cn(
          'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-border text-sm font-medium transition-all shadow-xs',
          safeCurrentPage >= safeTotalPages
            ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
            : 'bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border cursor-pointer'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
