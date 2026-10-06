import React, { useState, useEffect } from 'react'
import { Layers } from 'lucide-react'
import { resolveMediaUrl } from '../../utils/media'
import { cn } from '../../utils/cn'

export default function OrderThumbnail({ 
  src, 
  title = 'Service', 
  className, 
  iconClassName = 'w-6 h-6',
  textClassName = 'text-[10px]' 
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  const resolved = src ? resolveMediaUrl(src) : null
  const hasValidImage = Boolean(resolved && !imgError)

  return (
    <div
      className={cn(
        'w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F0F5FA] dark:bg-[#151e2e] shrink-0 border border-slate-100 dark:border-slate-800 flex items-center justify-center',
        className
      )}
    >
      {hasValidImage ? (
        <img
          src={resolved}
          alt={title || ''}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
          <Layers className={cn('text-sky-400 stroke-[1.75]', iconClassName)} />
          <span
            className={cn(
              'text-slate-500 dark:text-slate-400 font-medium truncate w-full mt-1 px-1',
              textClassName
            )}
          >
            {title || 'Service'}
          </span>
        </div>
      )}
    </div>
  )
}
