import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FolderKanban,
  Search,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Briefcase
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import OrderThumbnail from '../components/common/OrderThumbnail'
import { projectService } from '../services/projectService'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'

export default function ProjectsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)

  const isFreelancer = user?.role === 'freelancer'

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await projectService.getMyProjects({ limit: 50 })
      setProjects(res.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user?.role])

  // Dynamic real-time metrics strictly from actual projects (NO HARDCODING)
  const metrics = useMemo(() => {
    const total = projects.length
    const planning = projects.filter((p) => p.status === 'planning').length
    const inProgress = projects.filter((p) => p.status === 'in_progress').length
    const completed = projects.filter((p) => p.status === 'completed').length
    const totalValue = projects.reduce(
      (sum, p) => sum + (Number(p.order?.price) || 0),
      0
    )
    return { total, planning, inProgress, completed, totalValue }
  }, [projects])

  // Dynamic tab counts strictly from real projects
  const tabCounts = useMemo(() => {
    return {
      all: projects.length,
      in_progress: projects.filter((p) => p.status === 'in_progress').length,
      planning: projects.filter((p) => p.status === 'planning').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      cancelled: projects.filter((p) => p.status === 'cancelled').length,
    }
  }, [projects])

  // Filter tabs with live counts
  const tabs = [
    { id: 'all', label: t('project.all', 'Tất cả'), count: tabCounts.all },
    { id: 'in_progress', label: t('project.inProgress', 'Đang thực hiện'), count: tabCounts.in_progress },
    { id: 'planning', label: t('project.planning', 'Lên kế hoạch'), count: tabCounts.planning },
    { id: 'completed', label: t('project.completed', 'Đã hoàn thành'), count: tabCounts.completed },
    { id: 'cancelled', label: t('project.cancelled', 'Đã hủy'), count: tabCounts.cancelled },
  ]

  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      // Status tab filter
      if (activeTab !== 'all' && project.status !== activeTab) {
        return false
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const titleMatch = project.title?.toLowerCase().includes(q)
        const descMatch = project.description?.toLowerCase().includes(q)
        const buyerMatch = project.order?.buyer?.name?.toLowerCase().includes(q)
        const freelancerMatch = project.order?.freelancer?.name?.toLowerCase().includes(q)
        const idMatch = (project.id || project._id)?.toLowerCase().includes(q)
        const orderIdMatch = (project.orderId || project.order?._id || project.order?.id)?.toLowerCase().includes(q)

        if (!titleMatch && !descMatch && !buyerMatch && !freelancerMatch && !idMatch && !orderIdMatch) {
          return false
        }
      }

      return true
    })

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'valueHigh') {
        const valA = Number(a.order?.price || 0)
        const valB = Number(b.order?.price || 0)
        return valB - valA
      }
      if (sortBy === 'valueLow') {
        const valA = Number(a.order?.price || 0)
        const valB = Number(b.order?.price || 0)
        return valA - valB
      }
      // default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

    return result
  }, [projects, activeTab, searchTerm, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, sortBy])

  const PAGE_SIZE = 6
  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getProjectStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('project.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dotClass: 'bg-emerald-500',
        }
      case 'cancelled':
        return {
          label: t('project.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70',
          dotClass: 'bg-rose-500',
        }
      case 'in_progress':
        return {
          label: t('project.inProgress', 'Đang thực hiện'),
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/70',
          dotClass: 'bg-blue-500',
        }
      default: // planning
        return {
          label: t('project.planning', 'Lên kế hoạch'),
          className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/70',
          dotClass: 'bg-amber-500',
        }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:pt-8 md:pb-10 space-y-6">
      {/* Back button */}
      <div>
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

      {/* 1. Header with Typewriter effect */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
          <TypewriterText
            text={
              isFreelancer
                ? t('project.freelancerProjectsTitle', 'Dự án nhận được')
                : t('project.myProjects', 'Dự án của tôi')
            }
            speed={30}
          />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
          <TypewriterText
            text={
              isFreelancer
                ? t(
                    'project.freelancerProjectsSubtitle',
                    'Theo dõi tiến độ thực hiện và quản lý công việc cho khách hàng của bạn.'
                  )
                : t(
                    'project.myProjectsSubtitle',
                    'Theo dõi tiến độ, quản lý công việc và cộng tác trong các dự án của bạn.'
                  )
            }
            speed={16}
            delay={250}
          />
        </p>
      </div>

      {/* 2. Dynamic Real-time Business Metrics (for Freelancer) */}
      {!loading && !error && isFreelancer && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Projects */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {t('project.totalProjectsCount', 'Tổng dự án')}
              </span>
              <span className="text-lg sm:text-xl font-black text-foreground">
                {metrics.total}
              </span>
            </div>
          </div>

          {/* Planning */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {t('project.planningProjectsCount', 'Lên kế hoạch')}
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                {metrics.planning}
              </span>
            </div>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {t('project.inProgressProjectsCount', 'Đang thực hiện')}
              </span>
              <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400">
                {metrics.inProgress}
              </span>
            </div>
          </div>

          {/* Completed */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {t('project.completedProjectsCount', 'Đã hoàn thành')}
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.completed}
              </span>
            </div>
          </div>

          {/* Total Project Value */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {t('project.totalProjectValue', 'Tổng giá trị dự án')}
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate block">
                {formatCurrency(metrics.totalValue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter tabs & Search & Sort bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Status tabs with live counts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sort input */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('project.searchProjects', 'Tìm kiếm dự án...')}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="newest">{t('project.sortNewest', 'Mới nhất')}</option>
            <option value="valueHigh">{t('project.sortValueHigh', 'Giá trị: Cao đến Thấp')}</option>
            <option value="valueLow">{t('project.sortValueLow', 'Giá trị: Thấp đến Cao')}</option>
          </select>
        </div>
      </div>

      {/* 4. Projects Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl border border-border bg-card animate-pulse flex flex-col sm:flex-row gap-4 items-center justify-between"
            >
              <div className="flex items-center gap-4 w-full sm:w-2/3">
                <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
                <div className="space-y-2.5 w-full">
                  <div className="h-5 bg-muted rounded-md w-3/4" />
                  <div className="h-4 bg-muted rounded-md w-1/2" />
                  <div className="h-3 bg-muted rounded-md w-1/3" />
                </div>
              </div>
              <div className="w-full sm:w-1/4 h-12 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-foreground">{error}</h3>
          <Button onClick={fetchProjects} variant="outline" className="gap-2 mx-auto cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            {t('common.tryAgain', 'Thử lại')}
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            {projects.length === 0
              ? t('project.noProjectsFound', 'Không tìm thấy dự án nào')
              : t('project.noProjectsFiltered', 'Không có dự án nào trong mục này.')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {projects.length === 0
              ? isFreelancer
                ? t(
                    'project.freelancerNoProjectsDesc',
                    'Khi khách hàng tạo dự án từ đơn hàng của bạn, các dự án sẽ hiển thị tại đây.'
                  )
                : t('project.createProjectFromOrder', 'Tạo dự án từ Đơn hàng để bắt đầu theo dõi tiến độ và cộng tác.')
              : t('project.searchProjects', 'Thử tìm kiếm với từ khóa khác.')}
          </p>
          {projects.length === 0 && (
            <Button
              onClick={() => navigate('/app/orders')}
              className="mt-2 text-xs font-semibold cursor-pointer"
            >
              {t('project.goToOrders', 'Đi đến Đơn hàng')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedProjects.map((project) => {
            const projectId = project.id || project._id
            const projectCode = projectId ? `#PRJ${projectId.slice(-6).toUpperCase()}` : '#PRJ'
            const statusConfig = getProjectStatusConfig(project.status)

            const targetPerson = isFreelancer ? project.order?.buyer : project.order?.freelancer
            const personRoleLabel = isFreelancer
              ? t('project.client', 'Khách hàng')
              : t('project.freelancer', 'Freelancer')

            const relatedOrderId = project.order?.id || project.order?._id || project.orderId
            const orderCode = relatedOrderId ? `#ORD${String(relatedOrderId).slice(-6).toUpperCase()}` : null

            const totalTasks = project.taskStats?.total ?? 0
            const completedTasks = project.taskStats?.completed ?? 0
            const hasTaskData = totalTasks > 0
            const progress = typeof project.progress === 'number'
              ? project.progress
              : (hasTaskData ? Math.round((completedTasks / totalTasks) * 100) : (project.status === 'completed' ? 100 : 0))

            const price = project.order?.price || 0
            const deadlineDate = project.deadline || project.order?.deliveredAt || project.order?.deliveryDeadline

            return (
              <div
                key={projectId}
                onClick={() => navigate(`/app/projects/${projectId}`)}
                className="group flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all gap-5 cursor-pointer"
              >
                {/* Left: Thumbnail & Main Info with clear Hierarchy (Project -> Client -> Order -> Gig/Package) */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <OrderThumbnail
                    src={project.order?.gig?.img_url}
                    title={project.title}
                  />

                  <div className="space-y-2 min-w-0 flex-1">
                    {/* 1. Project Title & Project Code */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shrink-0">
                        {projectCode}
                      </span>
                    </div>

                    {/* 2. Client Info (Prominent for Freelancer) */}
                    {targetPerson && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Avatar
                          src={targetPerson?.avatar}
                          fallback={(targetPerson?.name || 'U').charAt(0).toUpperCase()}
                          className="w-5 h-5 text-[9px] shrink-0"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {targetPerson?.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shrink-0">
                          {personRoleLabel}
                        </span>
                        {targetPerson?.email && (
                          <span className="text-muted-foreground text-[11px] hidden sm:inline-block truncate">
                            • {targetPerson?.email}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 3. Related Order & Gig/Package relationship */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {orderCode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/app/orders/${relatedOrderId}`)
                          }}
                          title={t('order.viewDetails', 'Xem chi tiết đơn hàng')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 font-mono text-[11px] font-semibold text-foreground transition-colors cursor-pointer border border-border/80 hover:border-primary-300"
                        >
                          <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{t('project.linkedOrder', 'Đơn hàng')}: {orderCode}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </button>
                      ) : null}

                      {project.order?.package?.title && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-border/60 shrink-0">
                          <span>{t('project.servicePackage', 'Gói')}:</span>
                          <span className="font-semibold">{project.order.package.title}</span>
                        </span>
                      )}

                      {project.order?.gig?.title && project.order?.gig?.title !== project.title && (
                        <span className="text-[11px] text-muted-foreground truncate hidden md:inline-block">
                          ({t('project.originalGig', 'Dịch vụ gốc')}: {project.order.gig.title})
                        </span>
                      )}
                    </div>

                    {/* 4. Dates row: Start date & Deadline */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground pt-0.5">
                      <span>
                        {t('project.startDate', 'Bắt đầu')}: {formatDate(project.createdAt)}
                      </span>
                      {deadlineDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{t('project.deadline', 'Hạn chót')}: {formatDate(deadlineDate)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status, Tasks Progress, Price & CTA */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60 shrink-0">
                  {/* Status Badge & Tasks count */}
                  <div className="flex flex-wrap items-center sm:items-end gap-3 lg:gap-2">
                    {/* Status Badge */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0',
                        statusConfig.className
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dotClass)} />
                      {statusConfig.label}
                    </span>

                    {/* Tasks completed pill (only if backend has task data) */}
                    {hasTaskData && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 whitespace-nowrap shrink-0">
                        {t('project.tasksCount', { completed: completedTasks, total: totalTasks })}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (Strictly shown when data exists) */}
                  {hasTaskData && (
                    <div className="w-full sm:w-36 lg:w-40 space-y-1 text-left sm:text-right">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>{t('project.progress', 'Tiến độ')}</span>
                        <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress > 0
                              ? 'bg-primary-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          )}
                          style={{ width: `${Math.max(5, progress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Price & Action Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {price > 0 && (
                      <div className="text-sm sm:text-base font-extrabold text-foreground">
                        {formatCurrency(price)}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform">
                      <span>{t('project.openWorkspace', 'Vào không gian làm việc')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Pagination */}
      {!loading && !error && filteredProjects.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

