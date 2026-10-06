import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Plus,
  Search,
  ArrowLeft,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
  Star,
  Layers,
  ArrowRight,
  Filter,
  Loader2
} from 'lucide-react'
import { Button, Input, Select, Dialog, DialogTitle, EmptyState } from '../components/ui'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'
import GigFormModal from '../components/gigs/GigFormModal'
import { useAuthStore } from '../stores/authStore'
import { gigService } from '../services/gigService'
import { categoryService } from '../services/categoryService'
import { formatCurrency } from '../utils/format'
import { resolveMediaUrl } from '../utils/media'
import { cn } from '../utils/cn'

const PAGE_SIZE = 6

function FreelancerGigCard({ gig, onEdit, onDelete, onView }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)

  const gigId = gig._id || gig.id
  const rawImage = gig.img_url || gig.image
  const hasValidImage = Boolean(rawImage && !imgError)

  const categoryName =
    gig.category?.name ||
    (typeof gig.category === 'string' ? gig.category : '')
  const rating = Number(gig.rating || 0)
  const reviewCount = Number(gig.reviewCount ?? 0)
  const price = Number(gig.price ?? gig.packages?.[0]?.price ?? 0)
  const tags = Array.isArray(gig.tags) ? gig.tags : []

  return (
    <div className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200">
      {/* Image container */}
      <div
        onClick={() => onView(gigId)}
        className="aspect-[16/10] relative w-full overflow-hidden bg-slate-50 dark:bg-slate-900/40 cursor-pointer select-none"
      >
        {hasValidImage ? (
          <>
            <img
              src={resolveMediaUrl(rawImage)}
              alt={gig.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {categoryName && (
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/95 dark:bg-slate-900/90 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shadow-xs backdrop-blur-xs">
                {categoryName}
              </span>
            )}
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-900/50">
            <Layers className="w-10 h-10 text-sky-400 stroke-[1.75]" />
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground mt-2 line-clamp-1">
              {categoryName || gig.title}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          <h3
            onClick={() => onView(gigId)}
            className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer"
          >
            {gig.title}
          </h3>

          {gig.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
              {gig.description}
            </p>
          )}

          {/* Rating & Reviews */}
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-foreground">
              {rating > 0 ? rating.toFixed(1) : '0.0'}
            </span>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
        </div>

        {/* Price & Tags */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap max-w-[60%]">
            {tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground truncate"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block leading-none font-medium mb-0.5">
              {t('gig.from', 'Giá từ')}
            </span>
            <span className="text-base font-extrabold text-foreground">
              {formatCurrency(price)}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-3 border-t border-border grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onView(gigId)}
            className="text-xs font-semibold h-8 px-2 flex items-center justify-center cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {t('gig.viewGig', 'Xem')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => onEdit(gig, e)}
            className="text-xs font-semibold h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/40 flex items-center justify-center cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            {t('gig.editGig', 'Sửa')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => onDelete(gig, e)}
            className="text-xs font-semibold h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {t('common.delete', 'Xóa')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function GigsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const isFreelancer = user?.role === 'freelancer'

  // Data states
  const [gigs, setGigs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter & Pagination states
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryID, setCategoryID] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalGigs, setTotalGigs] = useState(0)

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingGig, setEditingGig] = useState(null)

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [gigToDelete, setGigToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Load categories
  useEffect(() => {
    if (!isFreelancer) return
    let isMounted = true
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories()
        const list = res.data || res || []
        if (isMounted) {
          setCategories(Array.isArray(list) ? list : [])
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    fetchCategories()
    return () => {
      isMounted = false
    }
  }, [isFreelancer])

  // Fetch Gigs owned by current freelancer
  const fetchMyGigs = useCallback(async () => {
    if (!isFreelancer) {
      setLoading(false)
      return
    }

    const freelancerId = user?._id || user?.id
    if (!freelancerId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = {
        freelancerID: freelancerId,
        page,
        limit: PAGE_SIZE,
        sort: sortBy,
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }
      if (categoryID) {
        params.categoryID = categoryID
      }

      const res = await gigService.getGigs(params)
      const dataObj = res.data || res

      // Backend returns either { data: { data: [...], total, totalPages } } or { data: [...] }
      const gigList = Array.isArray(dataObj.data)
        ? dataObj.data
        : Array.isArray(dataObj)
        ? dataObj
        : []

      const total = res.total ?? dataObj.total ?? gigList.length
      const totalP = res.totalPages ?? dataObj.totalPages ?? (Math.ceil(total / PAGE_SIZE) || 1)

      setGigs(gigList)
      setTotalGigs(total)
      setTotalPages(totalP)
    } catch (err) {
      console.error('Error fetching freelancer gigs:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load your gigs')
    } finally {
      setLoading(false)
    }
  }, [isFreelancer, user, page, sortBy, debouncedSearch, categoryID])

  useEffect(() => {
    fetchMyGigs()
  }, [fetchMyGigs])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGig(null)
    setFormModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (gig, e) => {
    e?.stopPropagation()
    setEditingGig(gig)
    setFormModalOpen(true)
  }

  // Delete handlers
  const handleOpenDelete = (gig, e) => {
    e?.stopPropagation()
    setGigToDelete(gig)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!gigToDelete) return
    setDeleting(true)
    try {
      const gigId = gigToDelete._id || gigToDelete.id
      await gigService.deleteGig(gigId)
      setDeleteModalOpen(false)
      setGigToDelete(null)
      // Refresh list
      fetchMyGigs()
    } catch (err) {
      console.error('Failed to delete gig:', err)
      alert(err.response?.data?.message || err.message || 'Failed to delete gig')
    } finally {
      setDeleting(false)
    }
  }

  // Navigation back
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/app/home')
    }
  }

  // If user is NOT a freelancer, show an informative role guard card
  if (!isFreelancer) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t('common.back', 'Quay lại')}</span>
        </button>

        <div className="p-8 sm:p-12 rounded-3xl border border-border bg-card text-center shadow-xs flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {t('gig.notFreelancerTitle', 'Chưa kích hoạt quyền Freelancer')}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
            {t(
              'gig.notFreelancerDesc',
              'Bạn cần có tài khoản Freelancer để đăng và quản lý các gói dịch vụ. Hãy đăng ký hồ sơ Freelancer của bạn để bắt đầu tiếp cận hàng ngàn khách hàng!'
            )}
          </p>

          <Button
            onClick={() => navigate('/app/become-freelancer')}
            className="mt-8 px-6 py-3 font-bold rounded-xl shadow-md"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            {t('gig.becomeFreelancerNow', 'Trở thành Freelancer ngay')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. Back button */}
      <div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t('common.back', 'Quay lại')}</span>
        </button>
      </div>

      {/* 2. Header with Typewriter effect */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
            <TypewriterText text={t('gig.myGigs', 'Dịch vụ của tôi')} speed={30} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
            <TypewriterText
              text={t('gig.myGigsSubtitle', 'Quản lý các dịch vụ và gói giá của bạn trên Workly.')}
              speed={16}
              delay={250}
            />
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl font-bold px-4 py-2.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('gig.createNewGig', 'Tạo dịch vụ mới')}</span>
        </Button>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-y border-border py-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('gig.searchPlaceholder', 'Tìm kiếm theo tên dịch vụ hoặc từ khóa...')}
            className="pl-9 text-xs sm:text-sm h-10 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Category */}
          <div className="w-40 sm:w-48">
            <Select
              value={categoryID}
              onChange={(e) => {
                setCategoryID(e.target.value)
                setPage(1)
              }}
              className="text-xs h-10 w-full"
            >
              <option value="">{t('gig.allCategories', 'Tất cả danh mục')}</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Sort */}
          <div className="w-36 sm:w-44">
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="text-xs h-10 w-full"
            >
              <option value="newest">{t('gig.newest', 'Mới nhất')}</option>
              <option value="priceAsc">{t('gig.priceLowHigh', 'Giá: Thấp đến Cao')}</option>
              <option value="priceDesc">{t('gig.priceHighLow', 'Giá: Cao đến Thấp')}</option>
              <option value="topRated">{t('gig.rating', 'Đánh giá')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 4. Gigs Content Area */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMyGigs} className="text-xs">
            {t('common.retry', 'Thử lại')}
          </Button>
        </div>
      )}

      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse flex flex-col h-[360px]"
            >
              <div className="aspect-[16/10] bg-muted w-full" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 bg-muted rounded w-full mt-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        /* Empty State */
        <div className="py-12">
          <EmptyState
            icon={Briefcase}
            title={t('gig.noGigsFound', 'Chưa có dịch vụ nào')}
            description={t(
              'gig.noGigsDesc',
              'Bạn chưa đăng dịch vụ nào. Hãy bắt đầu tạo dịch vụ đầu tiên để tiếp cận khách hàng tiềm năng!'
            )}
            action={
              <Button onClick={handleOpenCreate} className="rounded-xl font-bold">
                <Plus className="w-4 h-4 mr-2" />
                {t('gig.createFirstGig', 'Tạo dịch vụ ngay')}
              </Button>
            }
          />
        </div>
      ) : (
        /* Gigs Grid */
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <FreelancerGigCard
                key={gig._id || gig.id}
                gig={gig}
                onView={(id) => navigate(`/app/gigs/${id}`)}
                onEdit={(g, e) => handleOpenEdit(g, e)}
                onDelete={(g, e) => handleOpenDelete(g, e)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <GigFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingGig(null)
        }}
        onSuccess={() => {
          fetchMyGigs()
        }}
        gig={editingGig}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <DialogTitle className="text-lg font-bold text-foreground">
              {t('gig.confirmDeleteTitle', 'Xác nhận xóa dịch vụ')}
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('gig.deleteGigConfirm', 'Bạn có chắc chắn muốn xóa dịch vụ này?')}{' '}
              {t('gig.cannotUndo', 'Hành động này không thể hoàn tác.')}
            </p>
            {gigToDelete && (
              <p className="font-semibold text-foreground text-sm pt-1 line-clamp-1">
                "{gigToDelete.title}"
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="text-xs"
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {t('gig.deleting', 'Đang xóa...')}
                </>
              ) : (
                t('common.delete', 'Xóa dịch vụ')
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
