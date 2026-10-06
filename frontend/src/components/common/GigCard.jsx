import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Layers } from 'lucide-react'
import { Avatar } from '../ui'
import { cn } from '../../utils/cn'
import { resolveMediaUrl } from '../../utils/media'
import { formatCurrency } from '../../utils/format'

export default function GigCard({ gig, onClick, className }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)

  if (!gig) return null

  const gigId = gig.id || gig._id
  const rawImage = gig.img_url || gig.image
  const hasValidImage = Boolean(rawImage && !imgError)

  const categoryName =
    gig.category?.name ||
    (typeof gig.category === 'string' ? gig.category : '')

  const sellerName =
    gig.freelancer?.name ||
    gig.freelancer?.username ||
    gig.seller?.name ||
    t('gig.freelancer', 'Freelancer')

  const sellerAvatar = gig.freelancer?.avatar || gig.seller?.avatar
  const rating = Number(gig.rating || 0)
  const reviewCount = Number(gig.reviewCount ?? 0)
  const price = Number(gig.price ?? gig.packages?.[0]?.price ?? 0)
  const tags = Array.isArray(gig.tags) ? gig.tags : []

  return (
    <article
      onClick={onClick}
      className={cn(
        'group flex flex-col bg-card rounded-2xl border border-slate-200/80 dark:border-border overflow-hidden shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 cursor-pointer text-left select-none',
        className
      )}
    >
      {/* 1. Image or Fallback Area (Image 3 / Image 4) */}
      <div className="aspect-[16/10] relative w-full overflow-hidden bg-[#F0F5FA] dark:bg-[#151e2e] shrink-0">
        {hasValidImage ? (
          <>
            <img
              src={resolveMediaUrl(rawImage)}
              alt={gig.title || ''}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {categoryName && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-slate-900/90 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shadow-xs backdrop-blur-xs z-10">
                {categoryName}
              </span>
            )}
          </>
        ) : (
          /* Exact Image 3 Graphic Placeholder */
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
            <Layers className="w-10 h-10 text-sky-400 dark:text-sky-400 stroke-[1.75]" />
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 line-clamp-1 px-2">
              {categoryName || gig.title}
            </span>
          </div>
        )}
      </div>

      {/* 2. Card Body (Image 4 Layout) */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          {/* Seller row */}
          <div className="flex items-center gap-2">
            <Avatar
              src={sellerAvatar}
              fallback={sellerName.charAt(0).toUpperCase()}
              className="h-6 w-6 text-[10px] shrink-0"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {sellerName}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {gig.title}
          </h3>

          {/* Star Rating & Count */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = rating > 0 && starIndex <= Math.round(rating)
                return (
                  <Star
                    key={starIndex}
                    className={cn(
                      'h-3.5 w-3.5',
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
                    )}
                  />
                )
              })}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 ml-1">
              {rating > 0 ? rating.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              ({reviewCount})
            </span>
          </div>
        </div>

        {/* Bottom Row: Left tags + Right price (Image 4) */}
        <div className="pt-3 border-t border-slate-100 dark:border-border/60 flex items-end justify-between mt-auto gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 pr-1">
            {tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-50/80 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70 truncate max-w-[120px]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-muted-foreground block leading-none font-medium mb-0.5">
              {t('gig.from', 'From')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
              {formatCurrency(price)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
