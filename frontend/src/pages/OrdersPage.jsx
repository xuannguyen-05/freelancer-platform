import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ShoppingBag, 
  Layers, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Search,
  FolderKanban,
  DollarSign,
  TrendingUp,
  Inbox,
  User,
  Briefcase
} from 'lucide-react'
import { Avatar, Button, Select } from '../components/ui'
import OrderThumbnail from '../components/common/OrderThumbnail'
import { orderService } from '../services/orderService'
import { useAuthStore } from '../stores/authStore'
import { resolveMediaUrl } from '../utils/media'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'

const PAGE_SIZE = 6

export default function OrdersPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)

  const isFreelancer = user?.role === 'freelancer'

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = isFreelancer 
        ? await orderService.getFreelancerOrders() 
        : await orderService.getMyOrders()
      setOrders(res.data || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [isFreelancer])

  // Live Metrics summary calculated from real backend orders
  const metrics = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pending').length
    const inProgress = orders.filter(
      (o) => o.status === 'in_progress' || o.project?.status === 'in_progress'
    ).length
    const completed = orders.filter((o) => o.status === 'completed').length
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.price) || Number(o.totalAmount) || 0), 0)

    return { total, pending, inProgress, completed, totalRevenue }
  }, [orders])

  // Live Tab Counts calculated from real backend orders
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      in_progress: orders.filter(
        (o) => o.status === 'in_progress' || o.project?.status === 'in_progress'
      ).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  // Filter tabs
  const tabs = [
    { id: 'all', label: t('order.all', 'Tất cả'), count: tabCounts.all },
    { id: 'pending', label: t('order.pending', 'Đang xử lý'), count: tabCounts.pending },
    { id: 'in_progress', label: t('order.inProgress', 'Đang thực hiện'), count: tabCounts.in_progress },
    { id: 'completed', label: t('order.completed', 'Đã hoàn thành'), count: tabCounts.completed },
    { id: 'cancelled', label: t('order.cancelled', 'Đã hủy'), count: tabCounts.cancelled },
  ]

  // Filtering & Sorting
  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      // Tab filter
      if (activeTab === 'pending' && order.status !== 'pending') return false
      if (
        activeTab === 'in_progress' &&
        order.status !== 'in_progress' &&
        order.project?.status !== 'in_progress'
      )
        return false
      if (activeTab === 'completed' && order.status !== 'completed') return false
      if (activeTab === 'cancelled' && order.status !== 'cancelled') return false

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const titleMatch = order.gig?.title?.toLowerCase().includes(q)
        const personMatch = isFreelancer
          ? order.buyer?.name?.toLowerCase().includes(q) || order.buyer?.email?.toLowerCase().includes(q)
          : order.freelancer?.name?.toLowerCase().includes(q)
        const codeMatch = (order.id || order._id)?.toLowerCase().includes(q)
        if (!titleMatch && !personMatch && !codeMatch) return false
      }

      return true
    })

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'priceHigh') {
        const priceA = Number(a.price || a.totalAmount || 0)
        const priceB = Number(b.price || b.totalAmount || 0)
        return priceB - priceA
      }
      if (sortBy === 'priceLow') {
        const priceA = Number(a.price || a.totalAmount || 0)
        const priceB = Number(b.price || b.totalAmount || 0)
        return priceA - priceB
      }
      // default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

    return result
  }, [orders, activeTab, searchTerm, sortBy, isFreelancer])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, sortBy])

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1
  const paginatedOrders = filteredOrders.slice(
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

  const getOrderStatusConfig = (status, projectStatus) => {
    if (status === 'completed' || projectStatus === 'completed') {
      return {
        label: t('order.completed', 'Đã hoàn thành'),
        className:
          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70',
        dotClass: 'bg-emerald-500',
        progress: 100,
      }
    }
    if (status === 'cancelled') {
      return {
        label: t('order.cancelled', 'Đã hủy'),
        className:
          'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/70',
        dotClass: 'bg-rose-500',
        progress: 0,
      }
    }
    if (status === 'in_progress' || projectStatus === 'in_progress') {
      return {
        label: t('order.inProgress', 'Đang thực hiện'),
        className:
          'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/70',
        dotClass: 'bg-blue-500',
        progress: 60,
      }
    }
    return {
      label: t('order.pending', 'Đang xử lý'),
      className:
        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/70',
      dotClass: 'bg-amber-500',
      progress: 25,
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* 1. Back button */}
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

      {/* 2. Header with Typewriter effect */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
          <TypewriterText
            text={
              isFreelancer
                ? t('order.receivedOrders', 'Đơn hàng nhận được')
                : t('order.myOrders', 'Đơn hàng của tôi')
            }
            speed={30}
          />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
          <TypewriterText
            text={
              isFreelancer
                ? t(
                    'order.receivedOrdersSubtitle',
                    'Quản lý các đơn hàng khách hàng đã đặt cho dịch vụ của bạn.'
                  )
                : t(
                    'order.myOrdersSubtitle',
                    'Theo dõi các đơn hàng và quản lý công việc của bạn.'
                  )
            }
            speed={16}
            delay={250}
          />
        </p>
      </div>

      {/* 3. Freelancer Business Metrics Overview (Calculated from real backend data) */}
      {isFreelancer && !loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Orders */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('order.totalOrdersCount', 'Tổng đơn nhận')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-foreground">
              {metrics.total}
            </div>
          </div>

          {/* Pending */}
          <div className="p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {t('order.pendingOrdersCount', 'Chờ xử lý')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
              {metrics.pending}
            </div>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {t('order.inProgressOrdersCount', 'Đang thực hiện')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-blue-700 dark:text-blue-300">
              {metrics.inProgress}
            </div>
          </div>

          {/* Completed */}
          <div className="p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {t('order.completedOrdersCount', 'Đã hoàn thành')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {metrics.completed}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('order.totalRevenue', 'Tổng giá trị')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-foreground truncate">
              {formatCurrency(metrics.totalRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter tabs, Search & Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Status tabs with live counts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[11px] font-bold',
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isFreelancer
                  ? t('order.searchOrders', 'Tìm kiếm đơn hàng, khách hàng...')
                  : t('order.searchOrders', 'Tìm kiếm đơn hàng...')
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="w-36 sm:w-44 shrink-0">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs h-9 w-full rounded-xl"
            >
              <option value="newest">{t('order.sortNewest', 'Mới nhất')}</option>
              <option value="priceHigh">{t('order.sortPriceHigh', 'Giá: Cao đến Thấp')}</option>
              <option value="priceLow">{t('order.sortPriceLow', 'Giá: Thấp đến Cao')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 5. Orders Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl border border-border bg-card animate-pulse flex flex-col sm:flex-row gap-4 items-center justify-between"
            >
              <div className="flex items-center gap-4 w-full sm:w-2/3">
                <div className="w-24 h-24 rounded-xl bg-muted shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-5 bg-muted rounded-md w-3/4" />
                  <div className="h-4 bg-muted rounded-md w-1/2" />
                  <div className="h-3 bg-muted rounded-md w-1/3" />
                </div>
              </div>
              <div className="w-full sm:w-1/4 h-10 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-foreground">{error}</h3>
          <Button onClick={fetchOrders} variant="outline" className="gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            {t('common.tryAgain', 'Thử lại')}
          </Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            {orders.length === 0
              ? isFreelancer
                ? t('order.noFreelancerOrders', 'Chưa có đơn hàng nào được đặt')
                : t('order.noOrdersFound', 'Không tìm thấy đơn hàng nào')
              : t('order.noOrdersFiltered', 'Không có đơn hàng nào trong mục này.')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {orders.length === 0
              ? isFreelancer
                ? t(
                    'order.noFreelancerOrdersDesc',
                    'Khi khách hàng đặt dịch vụ từ các Gig của bạn, các đơn hàng sẽ hiển thị tại đây.'
                  )
                : t('order.noOrdersDesc', 'Bạn chưa đặt đơn hàng nào. Hãy khám phá các dịch vụ phù hợp!')
              : ''}
          </p>
          {orders.length === 0 && (
            <Button
              onClick={() => navigate(isFreelancer ? '/app/gigs' : '/app/home')}
              className="mt-2 text-xs font-semibold rounded-xl"
            >
              {isFreelancer ? (
                <>
                  <Briefcase className="w-4 h-4 mr-1.5" />
                  <span>{t('order.manageGigs', 'Quản lý dịch vụ')}</span>
                </>
              ) : (
                <span>{t('gig.browse', 'Khám phá dịch vụ')}</span>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const orderId = order.id || order._id
            const formattedCode = orderId
              ? `#ORD${orderId.slice(-6).toUpperCase()}`
              : '#ORD'
            const statusConfig = getOrderStatusConfig(
              order.status,
              order.project?.status
            )
            // Perspective: Freelancer sees Buyer, Buyer sees Freelancer
            const targetPerson = isFreelancer ? order.buyer : order.freelancer
            const personRoleLabel = isFreelancer
              ? t('orderDetail.customer', 'Khách hàng')
              : t('orderDetail.freelancer', 'Freelancer')
            const pkgTitle =
              order.package?.title || t('orderDetail.packageName', 'Gói dịch vụ')
            const deadlineDate =
              order.deliveredAt ||
              order.deliveryDeadline ||
              new Date(
                new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
              )

            return (
              <div
                key={orderId}
                onClick={() => navigate(`/app/orders/${orderId}`)}
                className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all gap-4 sm:gap-6 cursor-pointer"
              >
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  {/* Thumbnail Image with fallback */}
                  <OrderThumbnail
                    src={order.gig?.img_url}
                    title={order.gig?.title}
                  />

                  {/* Text Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                      {order.gig?.title || t('order.title', 'Dịch vụ')}
                    </h3>

                    {/* Target person row (Client if Freelancer view, Freelancer if Buyer view) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar
                        src={targetPerson?.avatar}
                        fallback={(targetPerson?.name || 'U').charAt(0).toUpperCase()}
                        className="w-5 h-5 text-[9px] shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {targetPerson?.name || personRoleLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70 whitespace-nowrap shrink-0">
                        {pkgTitle}
                      </span>

                      {/* Linked Project indicator */}
                      {order.project && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                          <FolderKanban className="w-3 h-3" />
                          <span>
                            {t('order.linkedProject', 'Dự án')}: {order.project.title || order.project.status}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Meta dates and code */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground pt-0.5">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formattedCode}
                      </span>
                      <span>•</span>
                      <span>
                        {t('order.orderDate', 'Đặt ngày')}: {formatDate(order.createdAt)}
                      </span>
                      <span>•</span>
                      <span>
                        {t('order.deliveryDeadline', 'Giao trước')}: {formatDate(deadlineDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Right: Status & Progress */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60 shrink-0">
                  <div className="space-y-2 text-left sm:text-right">
                    {/* Status Badge */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0',
                        statusConfig.className
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          statusConfig.dotClass
                        )}
                      />
                      {statusConfig.label}
                    </span>

                    {/* Progress Bar (Visible when completed or in progress with real progress) */}
                    {order.status === 'completed' || order.project?.status === 'completed' ? (
                      <div className="space-y-1 sm:text-right">
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t('order.progress', 'Tiến độ')} 100%
                        </div>
                        <div className="w-28 sm:w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    ) : (order.status === 'in_progress' || order.project?.status === 'in_progress') &&
                      typeof order.progress === 'number' ? (
                      <div className="space-y-1 sm:text-right">
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t('order.progress', 'Tiến độ')} {order.progress}%
                        </div>
                        <div className="w-28 sm:w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Price & Action */}
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm sm:text-base font-extrabold text-foreground">
                      <span className="text-[11px] font-normal text-muted-foreground mr-1">
                        {isFreelancer ? t('order.price', 'Giá') : t('order.fromPrice', 'Từ')}
                      </span>
                      {formatCurrency(
                        isFreelancer
                          ? order.price || order.totalAmount || 0
                          : order.totalAmount || order.price || 0
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform mt-0.5">
                      <span>{t('order.viewDetails', 'Xem chi tiết')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 6. Pagination */}
      {!loading && !error && filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
