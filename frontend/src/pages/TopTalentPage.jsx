import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Star,
  UsersRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import { freelancerService } from '../services/freelancerService'
import { categoryService } from '../services/categoryService'
import { resolveMediaUrl } from '../utils/media'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'

// Bilingual category names
const CATEGORY_NAMES = {
  'design': { vi: 'Thiết kế', en: 'Design' },
  'marketing': { vi: 'Tiếp thị', en: 'Marketing' },
  'mobile development': { vi: 'Lập trình di động', en: 'Mobile Development' },
  'web development': { vi: 'Lập trình Web', en: 'Web Development' },
  'writing': { vi: 'Viết lách & Dịch thuật', en: 'Writing' },
}

const getLocalizedCategoryName = (name = '', lang = 'vi') => {
  if (!name) return ''
  const key = name.toLowerCase().trim()
  if (CATEGORY_NAMES[key]) {
    return lang.startsWith('vi') ? CATEGORY_NAMES[key].vi : CATEGORY_NAMES[key].en
  }
  return name
}

export default function TopTalentPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialSearch = searchParams.get('q') || searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialSection = searchParams.get('section') || 'all'

  // Filter & Search states
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [activeSection, setActiveSection] = useState(initialSection) // 'all' | 'topRated' | 'experienced' | 'rising'
  const [sort, setSort] = useState('topRated') // 'topRated' | 'newest'

  // Data states
  const [freelancers, setFreelancers] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory) params.set('category', selectedCategory)
    if (activeSection !== 'all') params.set('section', activeSection)
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, selectedCategory, activeSection, setSearchParams])

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedCategory, activeSection, sort])

  // 1. Fetch Categories
  useEffect(() => {
    let isMounted = true
    categoryService.getCategories()
      .then((res) => {
        if (!isMounted) return
        const list = res?.data || (Array.isArray(res) ? res : [])
        setCategories(list)
      })
      .catch((err) => {
        console.error('Failed to load categories:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Fetch Freelancers from real backend with server-side pagination
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const params = {
      page: currentPage,
      limit: 6,
      sort: sort,
    }
    if (activeSection !== 'all') params.section = activeSection
    if (debouncedSearch) params.search = debouncedSearch
    if (selectedCategory) params.categoryID = selectedCategory

    freelancerService.getFreelancers(params)
      .then((res) => {
        if (!isMounted) return
        const list = res?.data || []
        setFreelancers(list)
        setTotal(res?.total || list.length)
        setTotalPages(res?.totalPages || 1)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load top talent:', err)
        setError(err?.message || 'Failed to load freelancers')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentPage, activeSection, debouncedSearch, selectedCategory, sort, retryToken])

  const clearFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setSelectedCategory('')
    setActiveSection('all')
    setSort('topRated')
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || activeSection !== 'all' || sort !== 'topRated'
  )

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 1. HERO / BANNER HEADER */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Back button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1)
                } else {
                  navigate('/app/home')
                }
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{t('common.back', 'Quay lại')}</span>
            </button>
          </div>

          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-primary-50/80 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800/80 dark:bg-primary-950/50 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('topTalent.badge', 'Chuyên gia nổi bật · Đã xác minh')}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl min-h-[2.5rem]">
              <TypewriterText
                text={t('topTalent.pageTitle', 'Chuyên gia hàng đầu')}
                speed={30}
              />
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed min-h-[1.75rem]">
              <TypewriterText
                text={t(
                  'topTalent.pageSubtitle',
                  'Khám phá các chuyên gia tài năng nổi bật trên Workly để hợp tác và hoàn thành dự án của bạn.'
                )}
                speed={16}
                delay={250}
              />
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t(
                  'topTalent.searchPlaceholder',
                  'Tìm theo tên chuyên gia, tiêu đề hoặc kỹ năng...'
                )}
                className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-2xs transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Section Discovery Pills (Descriptive, NOT a leaderboard) */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                activeSection === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-muted/70 text-foreground/80 hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              {t('topTalent.sectionAll', 'Tất cả chuyên gia')}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('topRated')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                activeSection === 'topRated'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-muted/70 text-foreground/80 hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{t('topTalent.sectionTopRated', 'Đánh giá cao')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('experienced')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                activeSection === 'experienced'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-muted/70 text-foreground/80 hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>{t('topTalent.sectionExperienced', 'Nhiều kinh nghiệm')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('rising')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                activeSection === 'rising'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-muted/70 text-foreground/80 hover:bg-muted hover:text-foreground border border-border/60'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('topTalent.sectionRising', 'Tài năng mới')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTERS & CONTROLS */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          {/* Categories Pill List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full sm:max-w-[70%]">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                !selectedCategory
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              )}
            >
              {t('topTalent.allCategories', 'Tất cả danh mục')}
            </button>

            {categories.map((cat) => {
              const catId = cat._id || cat.id
              const isSelected = selectedCategory === catId
              return (
                <button
                  key={catId}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? '' : catId)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap transition-all cursor-pointer',
                    isSelected
                      ? 'bg-primary-600 text-white font-semibold shadow-xs'
                      : 'bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border border-border/50'
                  )}
                >
                  {getLocalizedCategoryName(cat.name, i18n.language)}
                </button>
              )
            })}
          </div>

          {/* Stats & Clear Filters */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shadow-2xs">
              <Sparkles className="h-3 w-3 text-primary-500" />
              <span>
                {t('topTalent.showingResults', 'Hiển thị {{count}} tài năng', {
                  count: total || freelancers.length,
                })}
              </span>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
                title={t('topTalent.clearFilters', 'Xóa bộ lọc')}
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">{t('topTalent.clearFilters', 'Xóa bộ lọc')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN FREELANCER CARD GRID */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
        {/* Loading State: Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-muted shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-36 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
                <div className="flex gap-1.5 pt-2">
                  <div className="h-5 w-14 bg-muted rounded-full" />
                  <div className="h-5 w-16 bg-muted rounded-full" />
                  <div className="h-5 w-12 bg-muted rounded-full" />
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 mb-4">
              <UsersRound className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t('topTalent.errorTitle', 'Không thể tải danh sách tài năng')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button
              onClick={() => setRetryToken((t) => t + 1)}
              className="mt-5 rounded-xl px-5 text-xs font-semibold"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {t('common.tryAgain', 'Thử lại')}
            </Button>
          </div>
        ) : freelancers.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-border bg-card p-10 sm:p-14 text-center max-w-xl mx-auto my-8 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <UsersRound className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t('topTalent.emptyTitle', 'Không tìm thấy tài năng phù hợp')}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {t(
                'topTalent.emptyDesc',
                'Không có chuyên gia nào phù hợp với bộ lọc tìm kiếm hiện tại. Hãy thử từ khóa khác hoặc xóa bộ lọc.'
              )}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-5 rounded-xl px-5 text-xs font-semibold"
              >
                {t('topTalent.clearFilters', 'Xóa bộ lọc')}
              </Button>
            )}
          </div>
        ) : (
          /* Real Data Grid */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((talent) => {
              const talentId = talent.id || talent._id
              const avatarUrl = talent.avatar ? resolveMediaUrl(talent.avatar) : null
              const ratingVal = Number(talent.rating || 0)
              const reviewsVal = Number(talent.reviewCount || 0)
              const hasRating = ratingVal > 0 || reviewsVal > 0
              const sloganText = talent.slogan || talent.professionalTitle || ''
              const bioText = talent.description || talent.bio || ''
              const skillsList = Array.isArray(talent.skills)
                ? talent.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
                : []
              const visibleSkills = skillsList.slice(0, 3)
              const extraSkillsCount = skillsList.length - visibleSkills.length

              return (
                <div
                  key={talentId}
                  onClick={() => navigate(`/app/freelancers/${talentId}`)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 cursor-pointer"
                >
                  <div>
                    {/* Top Row: Avatar & Identity */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted/50 group-hover:border-primary-400 transition-colors">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={talent.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-lg font-bold text-primary-600">
                            {talent.name?.charAt(0)?.toUpperCase() || 'F'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="truncate text-sm sm:text-base font-bold text-foreground group-hover:text-primary-600 transition-colors">
                            {talent.name}
                          </h3>
                        </div>

                        {sloganText && (
                          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                            {sloganText}
                          </p>
                        )}

                        {/* Rating row (only show if rating data actually exists) */}
                        {hasRating && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-foreground">
                              {ratingVal > 0 ? ratingVal.toFixed(1) : '5.0'}
                            </span>
                            {reviewsVal > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                ({reviewsVal})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    {bioText && (
                      <p className="mt-3.5 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {bioText}
                      </p>
                    )}

                    {/* Skills Badges */}
                    {visibleSkills.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                        {visibleSkills.map((skillName, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-foreground/85 border border-border/50"
                          >
                            {skillName}
                          </span>
                        ))}
                        {extraSkillsCount > 0 && (
                          <span className="rounded-lg bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            +{extraSkillsCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Starting Price / Sample Gig / Action */}
                  <div className="mt-5 pt-3.5 border-t border-border/50 flex items-center justify-between gap-2">
                    <div>
                      {typeof talent.startingPrice === 'number' && talent.startingPrice > 0 ? (
                        <div>
                          <span className="text-[10px] text-muted-foreground block leading-none font-medium">
                            {t('topTalent.startingAt', 'Giá từ')}
                          </span>
                          <span className="text-sm font-extrabold text-foreground">
                            {formatCurrency(talent.startingPrice)}
                          </span>
                        </div>
                      ) : talent.sampleGigTitle ? (
                        <div className="max-w-[170px] truncate text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground block truncate">
                            {talent.sampleGigTitle}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {t('topTalent.verifiedPro', 'Chuyên gia uy tín')}
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-colors pointer-events-none"
                    >
                      <span>{t('topTalent.viewProfile', 'Xem hồ sơ')}</span>
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && freelancers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  )
}
