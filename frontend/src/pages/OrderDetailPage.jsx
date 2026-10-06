import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowLeft, 
  Layers, 
  MessageSquare, 
  Ban, 
  FolderPlus, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  Check,
  RefreshCw,
  X,
  FileText,
  ArrowRight,
  Star
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import OrderThumbnail from '../components/common/OrderThumbnail'
import ReviewModal from '../components/reviews/ReviewModal'
import { orderService } from '../services/orderService'
import { projectService } from '../services/projectService'
import { conversationService } from '../services/conversationService'
import { useAuthStore } from '../stores/authStore'
import { resolveMediaUrl } from '../utils/media'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'timeline' | 'project'
  
  // Project creation modal state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [projectDescription, setProjectDescription] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)

  const isBuyer = String(user?.id || user?._id || user?.userID) === String(order?.buyer?._id || order?.buyerID)
  const isFreelancer = String(user?.id || user?._id || user?.userID) === String(order?.freelancer?._id || order?.freelancerID)

  const fetchOrderDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await orderService.getOrderById(id)
      setOrder(res.data)
    } catch (err) {
      console.error('Failed to fetch order detail:', err)
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrderDetail()
    }
  }, [id])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('order.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dot: 'bg-emerald-500'
        }
      case 'cancelled':
        return {
          label: t('order.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70',
          dot: 'bg-rose-500'
        }
      case 'in_progress':
        return {
          label: t('order.inProgress', 'Đang thực hiện'),
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/70',
          dot: 'bg-blue-500'
        }
      default:
        return {
          label: t('order.pending', 'Đang xử lý'),
          className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/70',
          dot: 'bg-amber-500'
        }
    }
  }

  const getContractStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('contract.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70'
        }
      case 'cancelled':
        return {
          label: t('contract.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70'
        }
      case 'active':
      default:
        return {
          label: t('contract.active', 'Đang hiệu lực'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70'
        }
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!order) return

    setCreatingProject(true)
    try {
      const res = await projectService.createProject({
        orderId: order.id || order._id,
        description: projectDescription
      })
      toast.success(t('orderDetail.createProjectSuccess', 'Tạo dự án thành công!'))
      setShowCreateProjectModal(false)
      const projectId = res.data?.id || res.data?._id
      if (projectId) {
        navigate(`/app/projects/${projectId}`)
      } else {
        fetchOrderDetail()
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      toast.error(err.response?.data?.message || err.message || 'Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    setCancelling(true)
    try {
      await orderService.cancelOrder(order.id || order._id)
      toast.success(t('orderDetail.cancelSuccess', 'Hủy đơn hàng thành công!'))
      setShowCancelModal(false)
      fetchOrderDetail()
    } catch (err) {
      console.error('Failed to cancel order:', err)
      toast.error(err.response?.data?.message || err.message || 'Cannot cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleContact = async () => {
    const orderId = order.id || order._id
    if (order?.project?.id) {
      navigate(`/app/projects/${order.project.id}/messages`)
    } else {
      try {
        await conversationService.createConversation(orderId)
        navigate(`/app/messages?orderId=${orderId}`)
      } catch (err) {
        navigate(`/app/messages?orderId=${orderId}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-4 bg-muted rounded-md w-48 animate-pulse" />
        <div className="h-44 bg-card rounded-2xl border border-border animate-pulse p-6" />
        <div className="h-64 bg-card rounded-2xl border border-border animate-pulse p-6" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">
          {error || t('order.noOrdersFound', 'Không tìm thấy đơn hàng')}
        </h2>
        <Button onClick={() => navigate('/app/orders')} variant="outline" className="gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" />
          {t('orderDetail.back', 'Quay lại')}
        </Button>
      </div>
    )
  }

  const orderId = order.id || order._id
  const formattedCode = orderId ? `#ORD${orderId.slice(-6).toUpperCase()}` : '#ORD'
  const statusBadge = getOrderStatusBadge(order.status)
  const deadlineDate = order.deliveredAt || new Date(new Date(order.createdAt).getTime() + (order.package?.deliveryDays || 7) * 24 * 60 * 60 * 1000)

  // Features from package, if any (no hardcoded fallbacks)
  const featuresList = Array.isArray(order.package?.features) ? order.package.features.filter(Boolean) : []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 md:pt-6 md:pb-10 space-y-6">
      {/* 1. Breadcrumbs & Back */}
      <div className="space-y-8 sm:space-y-9">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link to="/app/orders" className="hover:text-primary-600 transition-colors">
            {isFreelancer
              ? t('orderDetail.breadcrumbReceivedOrders', 'Đơn hàng nhận được')
              : t('orderDetail.breadcrumbOrders', 'Đơn hàng của tôi')}
          </Link>
          <span>&gt;</span>
          <span className="text-foreground font-medium">
            {t('orderDetail.breadcrumbDetail', 'Chi tiết đơn hàng')}
          </span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/orders')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('orderDetail.back', 'Quay lại')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Header Card (Screen 2 Layout) */}
      <div className="mt-2 bg-card rounded-2xl border border-slate-200/80 dark:border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Thumbnail, Title, Freelancer or Client */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
          <OrderThumbnail 
            src={order.gig?.img_url} 
            title={order.gig?.title} 
          />

          <div className="space-y-1.5 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">
              {order.gig?.title || t('order.title', 'Dịch vụ')}
            </h1>
            <div className="text-xs text-muted-foreground font-medium">
              {t('order.code', 'Mã đơn')}: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formattedCode}</span>
            </div>

            {/* Target person info (Customer if Freelancer, Freelancer if Buyer) */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Avatar
                src={isFreelancer ? order.buyer?.avatar : order.freelancer?.avatar}
                fallback={((isFreelancer ? order.buyer?.name : order.freelancer?.name) || (isFreelancer ? 'U' : 'F')).charAt(0).toUpperCase()}
                className="w-6 h-6 text-[10px] shrink-0"
              />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {isFreelancer ? order.buyer?.name : order.freelancer?.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  {isFreelancer ? t('orderDetail.customer', 'Khách hàng') : t('orderDetail.freelancer', 'Freelancer')}
                </span>
                {isFreelancer && order.buyer?.email && (
                  <span className="text-muted-foreground text-[11px] hidden sm:inline">
                    ({order.buyer.email})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status, Price, Meta Dates */}
        <div className="flex md:flex-col items-start md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-border/60 gap-2 shrink-0">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
            statusBadge.className
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
            {statusBadge.label}
          </span>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {formatCurrency(order.price || order.totalAmount || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground space-y-1 mt-1">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  {order.package?.title || t('orderDetail.packageName', 'Gói tiêu chuẩn')}
                </span>
              </div>
              <div>{t('order.orderDate', 'Đặt ngày')}: {formatDate(order.createdAt)}</div>
              <div>{t('order.deliveryDeadline', 'Giao trước')}: {formatDate(deadlineDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-border text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'info'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('orderDetail.infoTab', 'Thông tin đơn hàng')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'timeline'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('orderDetail.timelineTab', 'Lịch trình')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={cn(
            'pb-3 relative transition-colors cursor-pointer',
            activeTab === 'project'
              ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('orderDetail.projectTab', 'Dự án')}
        </button>
      </div>

      {/* 4. Tab Content */}
      {/* TAB 1: THÔNG TIN ĐƠN HÀNG */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Buyer & Freelancer 2-col user boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer Box */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card flex items-center gap-3.5">
              <Avatar
                src={order.buyer?.avatar}
                fallback={(order.buyer?.name || 'B').charAt(0).toUpperCase()}
                className="w-11 h-11 text-xs shrink-0"
              />
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-1">
                  {t('orderDetail.buyer', 'Người mua')}
                </span>
                <div className="font-bold text-sm text-foreground truncate">
                  {order.buyer?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {order.buyer?.email || 'buyer@workly.com'}
                </div>
              </div>
            </div>

            {/* Freelancer Box */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card flex items-center gap-3.5">
              <Avatar
                src={order.freelancer?.avatar}
                fallback={(order.freelancer?.name || 'F').charAt(0).toUpperCase()}
                className="w-11 h-11 text-xs shrink-0"
              />
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-1">
                  {t('orderDetail.freelancer', 'Freelancer')}
                </span>
                <div className="font-bold text-sm text-foreground truncate">
                  {order.freelancer?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {order.freelancer?.email || 'freelancer@workly.com'}
                </div>
              </div>
            </div>
          </div>

          {/* Package Specs Grid (4 boxes) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
              <span className="text-[11px] text-muted-foreground block mb-1.5">
                {t('orderDetail.packageName', 'Gói dịch vụ')}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                {order.package?.title || 'Standard'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
              <span className="text-[11px] text-muted-foreground block mb-1">
                {t('orderDetail.price', 'Giá')}
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(order.price || 0)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
              <span className="text-[11px] text-muted-foreground block mb-1">
                {t('orderDetail.deliveryTime', 'Thời gian giao')}
              </span>
              <span className="text-sm font-bold text-foreground">
                {t('orderDetail.deliveryDays', { days: order.package?.deliveryDays || 7 })}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
              <span className="text-[11px] text-muted-foreground block mb-1">
                {t('orderDetail.revisions', 'Số lần chỉnh sửa')}
              </span>
              <span className="text-sm font-bold text-foreground">
                {order.package?.revisions ? t('orderDetail.revisionsCount', { count: order.package.revisions }) : t('orderDetail.unlimitedRevisions', 'Không giới hạn')}
              </span>
            </div>
          </div>

          {/* Compact Contract Summary Section */}
          {order.contract && (
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>{t('contract.serviceContract', 'Hợp đồng dịch vụ')}</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                    {`#HD${(order.contract.id || order.contract._id).slice(-6).toUpperCase()}`}
                  </span>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                    getContractStatusBadge(order.contract.status).className
                  )}>
                    {getContractStatusBadge(order.contract.status).label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground pt-0.5">
                  <div>
                    <span>{t('contract.totalValue', 'Tổng giá trị')}: </span>
                    <span className="font-extrabold text-foreground">{formatCurrency(order.contract.price || 0)}</span>
                  </div>
                  <div>
                    <span>{t('contract.paidAmount', 'Đã thanh toán')}: </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(order.contract.paidAmount || 0)}</span>
                  </div>
                  <div>
                    <span>{t('contract.remaining', 'Còn lại')}: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(order.contract.remaining || 0)}</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/app/contracts/${order.contract.id || order.contract._id}`)}
                className="w-full md:w-auto shrink-0 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 border-primary-200 dark:border-primary-800/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{t('contract.viewContractWorkspace', 'Xem chi tiết hợp đồng')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Service Details & Action Buttons */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="space-y-4 max-w-2xl flex-1">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">
                  {t('orderDetail.serviceDetails', 'Chi tiết dịch vụ')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {order.gig?.description || order.package?.description || t('orderDetail.noAdditionalDetails', 'Dịch vụ được cung cấp theo thỏa thuận và yêu cầu của đơn hàng.')}
                </p>
              </div>

              {featuresList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {t('orderDetail.featuresIncluded', 'Tính năng bao gồm')}
                  </h4>
                  <div className="space-y-2">
                    {featuresList.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-56 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
              <Button
                onClick={handleContact}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2 text-xs font-bold shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {isFreelancer
                    ? t('orderDetail.contactBuyer', 'Liên hệ khách hàng')
                    : t('orderDetail.contactFreelancer', 'Liên hệ freelancer')}
                </span>
              </Button>

              {/* Review button for Buyer on completed order without review */}
              {isBuyer && order.status === 'completed' && !order.review && (
                <Button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{t('review.writeReview', 'Viết đánh giá')}</span>
                </Button>
              )}

              {/* Reviewed Indicator Badge if order already has review */}
              {order.review && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{t('review.reviewedBadge', 'Đã đánh giá')}</span>
                  </div>
                  <span className="font-extrabold text-sm">{order.review.rating}.0 ★</span>
                </div>
              )}

              {isBuyer && order.status === 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{t('orderDetail.cancelOrder', 'Hủy đơn hàng')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Review Card or Review Invitation if order is completed */}
          {order.status === 'completed' && (
            order.review ? (
              /* Display real review */
              <div className="p-6 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 dark:border-amber-800/40 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={order.review.reviewer?.avatar || (isBuyer ? user?.avatar : order.buyer?.avatar)}
                      fallback={(order.review.reviewer?.name || order.buyer?.name || 'U').charAt(0).toUpperCase()}
                      className="w-10 h-10 text-xs shrink-0 ring-1 ring-amber-300 dark:ring-amber-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        {isBuyer
                          ? t('review.orderReviewCardTitleBuyer', 'Đánh giá của bạn')
                          : t('review.orderReviewCardTitleFreelancer', 'Đánh giá từ khách hàng')}
                      </div>
                      <div className="font-bold text-sm text-foreground">
                        {order.review.reviewer?.name || order.buyer?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'w-4 h-4',
                            s <= order.review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 dark:text-slate-700'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-extrabold text-foreground text-sm">
                      {order.review.rating}.0
                    </span>
                    {order.review.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        • {formatDate(order.review.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {order.review.comment ? (
                  <p className="text-sm text-foreground/90 leading-relaxed pt-1">
                    {order.review.comment}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic pt-1">
                    {t('review.noComment', 'Không có nhận xét chi tiết.')}
                  </p>
                )}
              </div>
            ) : isBuyer ? (
              /* Review Invitation Banner for Buyer */
              <div className="p-6 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {t('review.reviewInvitationTitle', 'Bạn cảm thấy thế nào về dịch vụ này?')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                      {t('review.reviewInvitationDesc', 'Đơn hàng đã hoàn thành. Hãy để lại đánh giá để giúp freelancer phát triển và hỗ trợ cộng đồng.')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-white mr-1.5" />
                  <span>{t('review.writeReview', 'Viết đánh giá')}</span>
                </Button>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* TAB 2: LỊCH TRÌNH */}
      {activeTab === 'timeline' && (
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-border bg-card">
          <h3 className="text-base font-bold text-foreground mb-6">
            {t('orderDetail.timelineTab', 'Lịch trình đơn hàng')}
          </h3>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Step 1: Created */}
            <div className="relative">
              <div className="absolute -left-[19px] sm:-left-[27px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-4 ring-card">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground">
                  {t('orderDetail.stepCreated', 'Đơn hàng được tạo')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
            </div>

            {/* Step 2: In Progress */}
            <div className="relative">
              <div className={cn(
                'absolute -left-[19px] sm:-left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-card',
                order.status !== 'pending' ? 'bg-emerald-500' : 'bg-primary-500'
              )}>
                {order.status !== 'pending' ? <Check className="w-3 h-3 stroke-[3]" /> : <Clock className="w-3 h-3" />}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground">
                  {t('orderDetail.stepInProgress', 'Bắt đầu thực hiện')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.status !== 'pending' ? formatDateTime(order.updatedAt) : t('order.pending', 'Đang chờ xác nhận')}
                </div>
              </div>
            </div>

            {/* Step 3: Delivered */}
            <div className="relative">
              <div className={cn(
                'absolute -left-[19px] sm:-left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-card',
                order.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              )}>
                {order.status === 'completed' ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground">
                  {t('orderDetail.stepDelivered', 'Giao sản phẩm')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.deliveredAt ? formatDateTime(order.deliveredAt) : `Dự kiến trước: ${formatDate(deadlineDate)}`}
                </div>
              </div>
            </div>

            {/* Step 4: Completed */}
            <div className="relative">
              <div className={cn(
                'absolute -left-[19px] sm:-left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-card',
                order.status === 'completed' ? 'bg-emerald-500' : order.status === 'cancelled' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
              )}>
                {order.status === 'completed' ? <Check className="w-3 h-3 stroke-[3]" /> : order.status === 'cancelled' ? <X className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground">
                  {order.status === 'cancelled' ? t('orderDetail.stepCancelled', 'Đã hủy') : t('orderDetail.stepCompleted', 'Hoàn thành')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.status === 'completed' ? formatDateTime(order.updatedAt) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DỰ ÁN (Screen 2 Right View) */}
      {activeTab === 'project' && (
        <div className="p-8 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-border bg-card text-center max-w-md mx-auto space-y-4">
          {order.project ? (
            /* State B: Project Exists */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-xs">
                <FolderKanban className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t('orderDetail.hasProjectTitle', 'Đã có dự án')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('orderDetail.hasProjectDesc', 'Đơn hàng đã được tạo dự án.')}
                </p>
              </div>
              <Button
                onClick={() => navigate(`/app/projects/${order.project.id || order.project._id}`)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                {t('orderDetail.viewProjectBtn', 'Xem dự án')}
              </Button>
            </div>
          ) : (
            /* State A: No Project */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                <FolderPlus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t('orderDetail.noProjectTitle', 'Chưa có dự án')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('orderDetail.noProjectDesc', 'Đơn hàng hiện chưa có dự án nào.')}
                </p>
              </div>

              {isBuyer ? (
                <Button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  {t('orderDetail.createProjectBtn', 'Tạo dự án')}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Khách hàng sẽ khởi tạo không gian dự án sau khi đặt hàng.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {t('orderDetail.createProjectModalTitle', 'Tạo dự án mới')}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('workspace.projectName', 'Tên dự án')}
                </label>
                <input
                  type="text"
                  disabled
                  value={order.gig?.title || ''}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs sm:text-sm text-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('orderDetail.projectDescLabel', 'Mô tả dự án (tùy chọn)')}
                </label>
                <textarea
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder={t('orderDetail.projectDescPlaceholder', 'Ghi chú thêm về dự án, yêu cầu kỹ thuật...')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="text-xs font-semibold"
                >
                  {t('workspace.close', 'Hủy')}
                </Button>
                <Button
                  type="submit"
                  disabled={creatingProject}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2"
                >
                  {creatingProject ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('orderDetail.creatingProject', 'Đang tạo...')}</span>
                    </>
                  ) : (
                    <span>{t('orderDetail.createProjectBtn', 'Tạo dự án')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {t('orderDetail.cancelOrder', 'Hủy đơn hàng')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t('orderDetail.cancelOrderConfirm', 'Bạn có chắc chắn muốn hủy đơn hàng này không?')}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="text-xs font-semibold flex-1"
              >
                {t('workspace.close', 'Đóng')}
              </Button>
              <Button
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex-1"
              >
                {cancelling ? 'Đang hủy...' : t('orderDetail.cancelOrder', 'Xác nhận hủy')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={order}
        onSuccess={() => fetchOrderDetail()}
      />
    </div>
  )
}
