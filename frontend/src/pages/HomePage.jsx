import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  BriefcaseBusiness, 
  ImageOff,
  Star,
  CheckCircle2,
  UsersRound,
  Check
} from 'lucide-react'


import { Avatar, Button } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import LandingDataState from '../components/landing/LandingDataState'
import { gigService } from '../services/gigService'
import { freelancerService } from '../services/freelancerService'
import { categoryService } from '../services/categoryService'
import GigCard from '../components/common/GigCard'
import TypewriterText from '../components/common/TypewriterText'
import { formatCurrency } from '../utils/format'
import { resolveMediaUrl } from '../utils/media'
import { cn } from '../utils/cn'


const CATEGORY_COLORS = [
  { dot: 'bg-primary-500', badge: 'bg-primary-600/90 text-white', border: 'border-primary-500' },
  { dot: 'bg-rose-500', badge: 'bg-rose-600/90 text-white', border: 'border-rose-500' },
  { dot: 'bg-emerald-500', badge: 'bg-emerald-600/90 text-white', border: 'border-emerald-500' },
  { dot: 'bg-violet-500', badge: 'bg-violet-600/90 text-white', border: 'border-violet-500' },
  { dot: 'bg-amber-500', badge: 'bg-amber-600/90 text-white', border: 'border-amber-500' },
  { dot: 'bg-cyan-500', badge: 'bg-cyan-600/90 text-white', border: 'border-cyan-500' },
  { dot: 'bg-pink-500', badge: 'bg-pink-600/90 text-white', border: 'border-pink-500' },
  { dot: 'bg-teal-500', badge: 'bg-teal-600/90 text-white', border: 'border-teal-500' },
]

// Category emoji matcher for visual appeal matching the reference screenshot
const getCategoryIcon = (name = '') => {
  const lower = name.toLowerCase()
  if (lower.includes('web') || lower.includes('dev') || lower.includes('lập trình')) return '💻'
  if (lower.includes('mobile') || lower.includes('app') || lower.includes('di động')) return '📱'
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('thiết kế')) return '🎨'
  if (lower.includes('data') || lower.includes('ai') || lower.includes('dữ liệu')) return '📊'
  if (lower.includes('cloud') || lower.includes('devops')) return '☁️'
  if (lower.includes('security') || lower.includes('cyber') || lower.includes('an ninh')) return '🔒'
  if (lower.includes('write') || lower.includes('content') || lower.includes('viết')) return '✍️'
  if (lower.includes('market') || lower.includes('seo') || lower.includes('tiếp thị')) return '📈'
  if (lower.includes('video') || lower.includes('photo') || lower.includes('hình ảnh')) return '🎬'
  if (lower.includes('music') || lower.includes('audio') || lower.includes('âm thanh')) return '🎵'
  if (lower.includes('business') || lower.includes('consult') || lower.includes('kinh doanh')) return '💼'
  return null
}



export default function HomePage() {
  const { t, i18n } = useTranslation()
  const SORT_OPTIONS = useMemo(() => [
    { value: 'topRated', label: t('home.sortTopRated', 'Top Rated') },
    { value: 'newest', label: t('home.sortNewest', 'Newest') },
    { value: 'priceAsc', label: t('home.sortPriceAsc', 'Price: Low to High') },
    { value: 'priceDesc', label: t('home.sortPriceDesc', 'Price: High to Low') },
  ], [t, i18n.language])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentView = searchParams.get('view') === 'talent' ? 'talent' : 'services'
  const initialQuery = searchParams.get('search') || searchParams.get('q') || ''

  const [categories, setCategories] = useState([])
  const [gigs, setGigs] = useState([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 9

  const [talentList, setTalentList] = useState([])
  const [talentState, setTalentState] = useState('loading')

  const [searchInput, setSearchInput] = useState(initialQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState(null)
  const [sort, setSort] = useState('topRated')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSortOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Realtime debounce search: automatically updates debouncedSearch 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset pagination to page 1 whenever debouncedSearch, sort, or activeCategory changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, sort, activeCategory])

  const [categoryState, setCategoryState] = useState('loading')
  const [gigState, setGigState] = useState('loading')
  const [retryToken, setRetryToken] = useState(0)

  // Explore scroll, bounce animation & temporary glowing border states
  const servicesSectionRef = useRef(null)
  const [isBouncing, setIsBouncing] = useState(false)
  const [isBorderHighlighted, setIsBorderHighlighted] = useState(false)

  // Infinite marquee carousel refs & state
  const marqueeContainerRef = useRef(null)
  const trackRef = useRef(null)
  const scrollPosRef = useRef(0)
  const isHoveredRef = useRef(false)
  const isTouchingRef = useRef(false)

  const handleServiceClick = (gigId) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/app/gigs/${gigId}` } })
    } else {
      navigate(`/app/gigs/${gigId}`)
    }
  }

  const handleTalentClick = (talent) => {
    const talentId = talent.id || talent.userID || talent._id
    const targetUrl = talentId ? `/app/freelancers/${talentId}` : (talent.sampleGigId ? `/app/gigs/${talent.sampleGigId}` : '/app/home?view=talent')
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: { from: targetUrl },
      })
    } else {
      navigate(targetUrl)
    }
  }

  const triggerServicesHighlight = () => {
    if (servicesSectionRef.current) {
      // Benchmark scroll exactly to the top of "All services", leaving 80px for the sticky header
      const headerOffset = 80
      const elementPosition = servicesSectionRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      })
      setIsBouncing(true)
      setIsBorderHighlighted(true)
      setTimeout(() => setIsBouncing(false), 900)
      setTimeout(() => setIsBorderHighlighted(false), 2500)
    }
  }

  const handleSelectCategory = (catId) => {
    setActiveCategory((prev) => (prev === catId ? null : catId))
    setCurrentPage(1)
  }

  const handleSelectAll = () => {
    setActiveCategory(null)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return
    setCurrentPage(newPage)
    if (servicesSectionRef.current) {
      const headerOffset = 80
      const elementPosition = servicesSectionRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      })
    }
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  // Infinite marquee auto-scrolling loop (from right to left)
  useEffect(() => {
    if (categories.length === 0) return

    const container = marqueeContainerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false }
    let isReducedMotion = mediaQuery.matches
    const handleMotionChange = (e) => {
      isReducedMotion = e.matches
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange)
    }

    let animationFrameId
    let lastTime = performance.now()
    const speed = 26 // pixels per second (slow, smooth, non-distracting)

    const updateMarquee = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
      lastTime = currentTime

      if (!isHoveredRef.current && !isTouchingRef.current && !isReducedMotion && container && track) {
        const singleSetWidth = track.scrollWidth / 4
        if (singleSetWidth > 0) {
          scrollPosRef.current += speed * deltaTime

          // Seamless wrapping: when set 1 has scrolled past, reset back by 1 set width
          if (scrollPosRef.current >= singleSetWidth * 2) {
            scrollPosRef.current -= singleSetWidth
          } else if (scrollPosRef.current <= singleSetWidth * 0.5) {
            scrollPosRef.current += singleSetWidth
          }

          container.scrollLeft = scrollPosRef.current
        }
      }

      animationFrameId = requestAnimationFrame(updateMarquee)
    }

    // Set initial scroll position to start of set 2 for seamless bidirectional movement
    const singleSetWidth = track.scrollWidth / 4
    if (singleSetWidth > 0 && scrollPosRef.current === 0) {
      scrollPosRef.current = singleSetWidth
      container.scrollLeft = singleSetWidth
    }

    animationFrameId = requestAnimationFrame(updateMarquee)

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange)
      }
    }
  }, [categories])

  // Manual scroll with subtle left/right arrows
  const handleManualScroll = (direction) => {
    const container = marqueeContainerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const singleSetWidth = track.scrollWidth / 4
    const step = 200
    let nextPos = container.scrollLeft + (direction === 'left' ? -step : step)

    if (nextPos >= singleSetWidth * 2.5) {
      nextPos -= singleSetWidth
      container.scrollLeft -= singleSetWidth
    } else if (nextPos <= singleSetWidth * 0.5) {
      nextPos += singleSetWidth
      container.scrollLeft += singleSetWidth
    }

    scrollPosRef.current = nextPos
    container.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const handleScrollEvent = () => {
      triggerServicesHighlight()
    }
    window.addEventListener('workly-scroll-services', handleScrollEvent)

    if (window.location.hash === '#services') {
      setTimeout(triggerServicesHighlight, 250)
    }

    return () => {
      window.removeEventListener('workly-scroll-services', handleScrollEvent)
    }
  }, [])

  const getCategoryColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || ''
    setSearchInput(q)
    setDebouncedSearch(q)
    const cat = searchParams.get('category') || searchParams.get('categoryId') || searchParams.get('categoryID')
    if (cat) {
      setActiveCategory(cat)
    }
    setCurrentPage(1)
  }, [searchParams])

  // Fetch Talent / Freelancers from backend API (with realtime search, category, sort & pagination)
  useEffect(() => {
    if (currentView !== 'talent') return

    let isMounted = true
    setTalentState('loading')

    const params = { page: currentPage, limit: PAGE_SIZE, sort }
    if (debouncedSearch) params.search = debouncedSearch
    if (activeCategory) params.categoryID = activeCategory

    freelancerService.getFreelancers(params)
      .then((res) => {
        if (!isMounted) return
        const list = res.data || []
        const totalTalent = res.total ?? list.length
        const calcTotalPages = res.totalPages ?? Math.max(1, Math.ceil(totalTalent / PAGE_SIZE))

        setTalentList(list)
        setTotal(totalTalent)
        setTotalPages(calcTotalPages)
        setTalentState('success')
      })
      .catch((err) => {
        console.error('Failed to fetch freelancers:', err)
        if (isMounted) setTalentState('error')
      })

    return () => {
      isMounted = false
    }
  }, [currentView, debouncedSearch, activeCategory, sort, currentPage, retryToken])

  // Fetch Categories from backend API
  useEffect(() => {
    let isMounted = true
    setCategoryState('loading')

    categoryService.getCategories()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res)
                ? res
                : []
          setCategories(list)
          setCategoryState('success')
        }
      })
      .catch(() => {
        if (isMounted) setCategoryState('error')
      })

    return () => {
      isMounted = false
    }
  }, [retryToken])

  // Fetch Gigs / Services from backend API (with realtime search, category, sort & pagination)
  useEffect(() => {
    if (currentView === 'talent') return

    let isMounted = true
    setGigState('loading')

    const params = { page: currentPage, limit: PAGE_SIZE, sort }
    if (debouncedSearch) params.search = debouncedSearch
    if (activeCategory) params.categoryID = activeCategory

    gigService.getGigs(params)
      .then((res) => {
        if (!isMounted) return
        const gigsData = res.data?.data || []
        const totalGigs = res.data?.total ?? res.total ?? 0
        const calcTotalPages = res.data?.totalPages ?? res.totalPages ?? Math.max(1, Math.ceil(totalGigs / PAGE_SIZE))

        setGigs(gigsData)
        setTotal(totalGigs)
        setTotalPages(calcTotalPages)
        setGigState('success')
      })
      .catch((err) => {
        console.error('Failed to fetch gigs:', err)
        if (isMounted) setGigState('error')
      })

    return () => {
      isMounted = false
    }
  }, [currentView, debouncedSearch, activeCategory, sort, currentPage, retryToken])

  const handleSearch = (e) => {
    e.preventDefault()
    setDebouncedSearch(searchInput.trim())
    setCurrentPage(1)
  }

  // Dynamic category pills list with [All] as the leading item
  const allCategoryPills = [
    { _id: null, name: t('common.all', 'All') },
    ...categories,
  ]

  // 4 duplicated sets for seamless continuous marquee loop without any jump
  const marqueeItems = categories.length > 0
    ? [
        ...allCategoryPills.map((item, idx) => ({ ...item, pillKey: `s1-${item._id || 'all'}-${idx}` })),
        ...allCategoryPills.map((item, idx) => ({ ...item, pillKey: `s2-${item._id || 'all'}-${idx}` })),
        ...allCategoryPills.map((item, idx) => ({ ...item, pillKey: `s3-${item._id || 'all'}-${idx}` })),
        ...allCategoryPills.map((item, idx) => ({ ...item, pillKey: `s4-${item._id || 'all'}-${idx}` })),
      ]
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* Search & Filter Hero Banner — Full-bleed continuous cream/yellow background */}
      <div className="w-full relative overflow-x-clip bg-[#FFF9EB] dark:bg-[#1f1e18] border-b border-amber-200/60 dark:border-border/60 m-0 p-0">
        {/* Subtle Decorative Elements - Far Left (opacity 5–15%, stay behind content) */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1/4 min-w-[180px] max-w-[320px] flex items-center z-0 select-none overflow-hidden">
          {/* Soft yellow circular gradient */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-52 h-44 bg-amber-300/25 dark:bg-amber-500/15 rounded-full blur-3xl" />

          {/* Thin flowing curved lines & a few small dots */}
          <svg className="w-full h-36 text-amber-400/60 dark:text-amber-500/40" viewBox="0 0 320 160" fill="none">
            <path d="M-10,95 C50,30 110,140 210,85 C255,60 285,85 330,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
            <path d="M-30,120 C35,65 95,160 190,115 C240,95 275,115 315,95" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" strokeLinecap="round" opacity="0.35" />
            <circle cx="210" cy="85" r="3" fill="currentColor" opacity="0.5" />
            <circle cx="80" cy="98" r="2.5" fill="currentColor" opacity="0.4" />
            <circle cx="270" cy="72" r="2" fill="currentColor" opacity="0.35" />
          </svg>

          {/* 1 subtle sparkle/star shape */}
          <div className="absolute left-8 sm:left-14 top-6 sm:top-8 animate-float-slow opacity-75">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] animate-sparkle" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        </div>

        {/* Subtle Decorative Elements - Far Right (opacity 5–15%, stay behind content) */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/4 min-w-[180px] max-w-[320px] flex items-center justify-end z-0 select-none overflow-hidden">
          {/* Soft yellow circular gradient */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-52 h-44 bg-amber-300/25 dark:bg-amber-500/15 rounded-full blur-3xl" />

          {/* Thin flowing curved lines (mirrored) & a few small dots */}
          <svg className="w-full h-36 text-amber-400/60 dark:text-amber-500/40 scale-x-[-1]" viewBox="0 0 320 160" fill="none">
            <path d="M-10,95 C50,30 110,140 210,85 C255,60 285,85 330,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
            <path d="M-30,120 C35,65 95,160 190,115 C240,95 275,115 315,95" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" strokeLinecap="round" opacity="0.35" />
            <circle cx="210" cy="85" r="3" fill="currentColor" opacity="0.5" />
            <circle cx="80" cy="98" r="2.5" fill="currentColor" opacity="0.4" />
            <circle cx="270" cy="72" r="2" fill="currentColor" opacity="0.35" />
          </svg>

          {/* 1 subtle sparkle/star shape */}
          <div className="absolute right-8 sm:right-14 top-6 sm:top-8 animate-float-reverse opacity-75">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] animate-sparkle" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        </div>

        {/* Center Content Container — Centered max-width with padding */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-4">
          {/* Row 1: Search Input and Sort Dropdown with rounded-full pill shapes */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearch} className="relative flex-1 w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={currentView === 'talent' ? t('home.searchTalentPlaceholder', 'Search talent by name, skill, or service...') : t('home.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 sm:h-12 w-full rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card pl-11 pr-4 text-sm text-foreground shadow-xs placeholder:text-muted-foreground transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </form>
            {/* Compact Sort Dropdown */}
            <div ref={sortDropdownRef} className="relative z-30 shrink-0">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                className={cn(
                  "h-11 sm:h-12 px-4 sm:px-5 rounded-full border bg-white dark:bg-card text-sm font-medium shadow-xs cursor-pointer transition-all select-none focus:outline-none flex items-center justify-center gap-1.5 whitespace-nowrap",
                  isSortOpen
                    ? "border-primary-500 ring-2 ring-primary-500/20 text-primary-600 dark:text-primary-400"
                    : "border-slate-200/90 dark:border-border text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <span>{t('common.sort', 'Sort')}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isSortOpen ? "rotate-180 text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500")} />
              </button>

              {isSortOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-2 w-[240px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-xl py-2 z-[60]"
                >
                  <div className="px-4 pt-1 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t('common.sort', 'Sort')}
                  </div>
                  {SORT_OPTIONS.map((option) => {
                    const isActive = sort === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setSort(option.value)
                          setCurrentPage(1)
                          setIsSortOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer",
                          isActive
                            ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold"
                            : "text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <span>{option.label}</span>
                        {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0 ml-3" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Category Infinite Marquee Carousel with Left/Right Arrow Controls */}
          {categoryState === 'error' && categories.length === 0 ? (
            <div className="text-sm text-destructive">
              {t('home.categoriesErrorDescription')}
            </div>
          ) : categoryState === 'loading' && categories.length === 0 ? (
            <div className="flex gap-2 overflow-x-hidden py-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full shrink-0" />
              ))}
            </div>
          ) : (
            <div className="relative flex items-center group/marquee">
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={() => handleManualScroll('left')}
                aria-label="Scroll categories left"
                className="shrink-0 z-20 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs cursor-pointer mr-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Infinite Marquee Track Container */}
              <div
                ref={marqueeContainerRef}
                onMouseEnter={() => { isHoveredRef.current = true }}
                onMouseLeave={() => { isHoveredRef.current = false }}
                onTouchStart={() => { isTouchingRef.current = true }}
                onTouchEnd={() => {
                  setTimeout(() => {
                    isTouchingRef.current = false
                    if (marqueeContainerRef.current) {
                      scrollPosRef.current = marqueeContainerRef.current.scrollLeft
                    }
                  }, 1000)
                }}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="relative flex-1 overflow-x-auto no-scrollbar py-1 touch-pan-x select-none"
              >
                {/* Soft Edge Gradient Fade Masks matching the cream hero background */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FFF9EB] via-[#FFF9EB]/60 to-transparent dark:from-[#1f1e18] dark:via-[#1f1e18]/60 dark:to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FFF9EB] via-[#FFF9EB]/60 to-transparent dark:from-[#1f1e18] dark:via-[#1f1e18]/60 dark:to-transparent z-10" />

                {/* Continuous Items Track */}
                <div ref={trackRef} className="flex items-center gap-2 w-max">
                  {marqueeItems.map((cat) => {
                    const isActive = (cat._id === null && activeCategory === null) || (cat._id !== null && activeCategory === cat._id)
                    return (
                      <button
                        key={cat.pillKey}
                        onClick={() => (cat._id === null ? handleSelectAll() : handleSelectCategory(cat._id))}
                        className={cn(
                          'flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer border whitespace-nowrap select-none',
                          isActive
                            ? 'border-primary-600 bg-primary-600 text-white font-semibold shadow-sm'
                            : 'border-slate-200/90 dark:border-border bg-white dark:bg-card text-foreground hover:bg-slate-100/80 dark:hover:bg-muted'
                        )}
                      >
                        <span>{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={() => handleManualScroll('right')}
                aria-label="Scroll categories right"
                className="shrink-0 z-20 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs cursor-pointer ml-1.5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Services Section — Target of Explore scroll */}
      <div
        id="services-section"
        ref={servicesSectionRef}
        className={cn(
          'scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 transition-all duration-700 rounded-3xl border border-transparent',
          isBouncing && 'animate-brake-bounce',
          isBorderHighlighted && 'services-highlight-ring bg-primary-50/15 dark:bg-primary-950/15'
        )}
      >
        {/* Discovery View: Talent or Services */}
        {currentView === 'talent' ? (
          <>
            {/* Section Header: "Meet the talent" with typewriter effect for talent count */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground min-h-[1.75rem]">
                <TypewriterText
                  text={
                    activeCategory 
                      ? categories.find((c) => c._id === activeCategory)?.name || t('home.peopleTitle', 'Meet the talent')
                      : t('home.peopleTitle', 'Meet the talent')
                  }
                  speed={35}
                />
              </h2>
              {talentState === 'success' && (
                <p className="mt-1 text-xs sm:text-sm font-normal text-muted-foreground min-h-[1.25rem]">
                  <TypewriterText text={t('home.talentAvailable', { count: total })} speed={25} delay={250} />
                </p>
              )}
            </div>

            {/* Talent Grid or Status States */}
            {talentState === 'loading' ? (
              <LandingDataState status="loading" count={6} />
            ) : talentState === 'error' ? (
              <LandingDataState 
                status="error"
                icon={UsersRound}
                title={t('home.servicesErrorTitle')} 
                description={t('home.servicesErrorDescription')} 
                actionLabel={t('common.tryAgain')}
                onRetry={() => setRetryToken((p) => p + 1)} 
              />
            ) : talentList.length === 0 ? (
              <LandingDataState 
                status="empty"
                icon={UsersRound}
                title={t('home.peopleEmpty', 'No talent found')} 
                description={t('home.peopleDescription')} 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {talentList.map((talent) => (
                  <article 
                    key={talent.id}
                    onClick={() => handleTalentClick(talent)}
                    className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={talent.avatar}
                          alt={talent.name}
                          fallback={talent.name?.charAt(0) || 'F'}
                          className="h-14 w-14 bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300 ring-2 ring-border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary-600 transition-colors">
                              {talent.name}
                            </h3>
                            <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t('landing.freelancers.serviceProvider', 'Workly Verified Professional')}</p>

                          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span>{talent.rating > 0 ? talent.rating.toFixed(1) : '0.0'}</span>
                            <span className="text-muted-foreground font-normal">({talent.reviewCount ?? 0})</span>
                          </div>
                        </div>
                      </div>

                      {talent.categories?.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {talent.categories.map((cat) => (
                            <span
                              key={cat}
                              className="rounded-full border border-primary-200/70 dark:border-primary-800/70 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {talent.sampleGigTitle && (
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          <span className="font-semibold text-foreground">{t('home.featuredService', 'Featured service:')}</span> {talent.sampleGigTitle}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 border-t border-border pt-4">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTalentClick(talent)
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-1.5 text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                      >
                        {t('home.viewProfile', 'View Profile')} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Section Header: "All services" with smaller font & typewriter effect for service count */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground min-h-[1.75rem]">
                <TypewriterText
                  text={
                    activeCategory 
                      ? categories.find((c) => c._id === activeCategory)?.name || t('home.allServices', 'All services')
                      : t('home.allServices', 'All services')
                  }
                  speed={35}
                />
              </h2>
              {gigState === 'success' && (
                <p className="mt-1 text-xs sm:text-sm font-normal text-muted-foreground min-h-[1.25rem]">
                  <TypewriterText text={t('home.servicesAvailable', { count: total })} speed={25} delay={250} />
                </p>
              )}
            </div>

            {/* Grid or Status States */}
            {gigState === 'loading' ? (
              <LandingDataState status="loading" count={9} />
            ) : gigState === 'error' ? (
              <LandingDataState 
                status="error"
                icon={BriefcaseBusiness}
                title={t('home.servicesErrorTitle')} 
                description={t('home.servicesErrorDescription')} 
                actionLabel={t('common.tryAgain')}
                onRetry={() => setRetryToken((p) => p + 1)} 
              />
            ) : gigs.length === 0 ? (
              <LandingDataState 
                status="empty"
                icon={BriefcaseBusiness}
                title={t('gig.noGigsFound')} 
                description={t('home.servicesEmptyDescription')} 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gigs.map((gig) => {
                  const gigId = gig.id || gig._id
                  return (
                    <GigCard
                      key={gigId}
                      gig={gig}
                      onClick={() => handleServiceClick(gigId)}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Unified Pagination UI for both Services and Talent views */}
        {total > 0 && (
          <nav
            aria-label="Pagination"
            className="mt-10 sm:mt-12 flex items-center justify-center gap-1.5 sm:gap-2 select-none"
          >
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || (currentView === 'talent' ? talentState === 'loading' : gigState === 'loading')}
              aria-label="Previous page"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-border text-sm font-medium transition-all shadow-xs',
                currentPage <= 1 || (currentView === 'talent' ? talentState === 'loading' : gigState === 'loading')
                  ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-white dark:bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border cursor-pointer'
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
                    className="flex h-10 w-9 items-center justify-center text-sm font-medium text-muted-foreground"
                  >
                    ...
                  </span>
                )
              }

              const pageNum = Number(item)
              const isActive = pageNum === currentPage

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={currentView === 'talent' ? talentState === 'loading' : gigState === 'loading'}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer border',
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                      : 'border-slate-200/90 dark:border-border bg-white dark:bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || (currentView === 'talent' ? talentState === 'loading' : gigState === 'loading')}
              aria-label="Next page"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-border text-sm font-medium transition-all shadow-xs',
                currentPage >= totalPages || (currentView === 'talent' ? talentState === 'loading' : gigState === 'loading')
                  ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-white dark:bg-card text-foreground hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-300 dark:hover:border-border cursor-pointer'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
