import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  DollarSign,
  Ban
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import OrderThumbnail from '../components/common/OrderThumbnail'
import { contractService } from '../services/contractService'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

export default function ContractDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)

  // Cancel contract modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingContract, setCancellingContract] = useState(false)

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchContractDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await contractService.getContractById(id)
      setContract(res.data)
      if (res.data?.remaining > 0) {
        setPayAmount(res.data.remaining.toString())
      }
    } catch (err) {
      console.error('Failed to load contract:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchContractDetail()
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

  const currentUserId = String(user?.id || user?._id || user?.userID || '')
  const isBuyer = contract ? String(contract.buyerId || contract.buyer?._id || contract.buyer?.id) === currentUserId : false
  const isFreelancer = contract ? (
    String(contract.freelancerId || contract.freelancer?._id || contract.freelancer?.id) === currentUserId ||
    (contract.memberIds || []).some(mId => String(mId) === currentUserId)
  ) : false
  const isLeadFreelancer = contract ? (
    String(contract.freelancerId || contract.freelancer?._id || contract.freelancer?.id) === currentUserId
  ) : false

  const getContractStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('contract.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dot: 'bg-emerald-500'
        }
      case 'cancelled':
        return {
          label: t('contract.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70',
          dot: 'bg-rose-500'
        }
      case 'active':
      default:
        return {
          label: t('contract.active', 'Đang hiệu lực'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dot: 'bg-emerald-500'
        }
    }
  }

  const handlePayContract = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(payAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('contract.invalidAmount', 'Số tiền thanh toán không hợp lệ'))
      return
    }

    if (amountNum > (contract.remaining || 0)) {
      toast.error(t('contract.amountExceedsRemaining', 'Số tiền vượt quá số dư còn lại'))
      return
    }

    setPaying(true)
    try {
      await contractService.payContract(contract.id || contract._id, amountNum)
      toast.success(t('contract.paymentSuccess', 'Thanh toán hợp đồng thành công!'))
      setShowPayModal(false)
      fetchContractDetail()
    } catch (err) {
      console.error('Failed to pay contract:', err)
      toast.error(err.response?.data?.message || err.message || 'Thanh toán thất bại')
    } finally {
      setPaying(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      await contractService.updateContractStatus(contract.id || contract._id, newStatus)
      if (newStatus === 'active') {
        toast.success(t('contract.activateSuccess', 'Kích hoạt hợp đồng thành công!'))
      } else if (newStatus === 'completed') {
        toast.success(t('contract.completeSuccess', 'Hoàn thành hợp đồng thành công!'))
      } else {
        toast.success('Cập nhật trạng thái thành công!')
      }
      fetchContractDetail()
    } catch (err) {
      console.error('Failed to update contract status:', err)
      toast.error(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleCancelContract = async () => {
    setCancellingContract(true)
    try {
      await contractService.updateContractStatus(contract.id || contract._id, 'cancelled')
      toast.success(t('contract.cancelContractSuccess', 'Đã hủy hợp đồng thành công!'))
      setShowCancelModal(false)
      fetchContractDetail()
    } catch (err) {
      console.error('Failed to cancel contract:', err)
      toast.error(err.response?.data?.message || err.message || t('contract.cancelContractError', 'Không thể hủy hợp đồng'))
    } finally {
      setCancellingContract(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-4 bg-muted rounded-md w-48 animate-pulse" />
        <div className="h-40 bg-card rounded-2xl border border-border animate-pulse p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-card rounded-2xl border border-border animate-pulse" />
          <div className="h-72 bg-card rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">
          {error || t('contract.noContractsFound', 'Không tìm thấy hợp đồng')}
        </h2>
        <Button onClick={() => navigate('/app/contracts')} variant="outline" className="gap-2 mx-auto cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          {t('contract.backToContracts', 'Quay lại hợp đồng')}
        </Button>
      </div>
    )
  }

  const contractId = contract.id || contract._id
  const contractCode = contractId ? '#HD' + contractId.slice(-6).toUpperCase() : '#HD'
  const statusBadge = getContractStatusBadge(contract.status)
  const budget = contract.budget || contract.price || 0
  const paidAmount = Number(contract.paidAmount ?? 0)
  const remaining = Math.max(0, budget - paidAmount)
  const paidPercent = budget > 0 ? Math.round((paidAmount / budget) * 100) : 0

  const title = contract.project?.title || contract.order?.title || t('workspace.serviceContract', 'Hợp đồng dịch vụ')
  const contractTypeLabel = contract.type === 'hourly'
    ? t('contract.hourly', 'Theo giờ')
    : t('contract.fixed', 'Cố định')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 space-y-6">
      {/* 1. Breadcrumbs & Back */}
      <div className="space-y-8 sm:space-y-9">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link to="/app/contracts" className="hover:text-primary-600 transition-colors">
            {t('contract.myContracts', 'Hợp đồng của tôi')}
          </Link>
          <span>&gt;</span>
          <span className="text-foreground font-medium">
            {t('contract.contractDetail', 'Chi tiết hợp đồng')}
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => navigate('/app/contracts')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('contract.backToContracts', 'Quay lại hợp đồng')}</span>
          </button>
        </div>
      </div>

      {/* 2. Contract Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            {/* Contract Type Pill */}
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
              {contractTypeLabel}
            </span>
            {/* Contract Status Badge */}
            <span className={cn(
              'px-3 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap shrink-0',
              statusBadge.className
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusBadge.dot)} />
              <span>{statusBadge.label}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>{t('contract.contractCode', 'Mã hợp đồng')}:</span>
              <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded-md">
                {contractCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('contract.signedDate', 'Ngày ký')}:</span>
              <span className="font-medium text-foreground">
                {formatDate(contract.startDate || contract.createdAt)}
              </span>
            </div>
            {contract.endDate && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('contract.deadline', 'Hạn chót')}:</span>
                <span className="font-medium text-foreground">
                  {formatDate(contract.endDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Header Right: Secure Payment Badge & Lifecycle Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                {t('contract.securePayment', 'Thanh toán an toàn')}
              </div>
              <div className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 leading-tight mt-0.5">
                {t('contract.escrowDesc', 'Bảo đảm 100% bởi Workly')}
              </div>
            </div>
          </div>

          {isBuyer && contract.status === 'active' && remaining === 0 && (
            <Button
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('completed')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 py-2 px-3.5 rounded-xl shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('contract.completeContract', 'Hoàn thành hợp đồng')}</span>
            </Button>
          )}

          {/* Lead Freelancer cancel contract button */}
          {isLeadFreelancer && contract.status === 'active' && (
            paidAmount > 0 ? (
              <div
                title={t('contract.cannotCancelPaidDesc', 'Khách hàng đã thanh toán vào hợp đồng này. Vui lòng hoàn tất công việc hoặc liên hệ hỗ trợ để xử lý hoàn tiền nếu có tranh chấp.')}
                className="text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-xl border border-border/70 flex items-center gap-1.5 cursor-not-allowed"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-semibold">{t('contract.cannotCancelPaid', 'Hợp đồng đã có thanh toán')}</span>
              </div>
            ) : (
              <Button
                variant="outline"
                disabled={updatingStatus || cancellingContract}
                onClick={() => setShowCancelModal(true)}
                className="border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold gap-1.5 py-2 px-3.5 rounded-xl cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{t('contract.cancelContract', 'Hủy hợp đồng')}</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* 3. Related Order & Project Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Related Order Card */}
        {contract.order && (
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <OrderThumbnail
                src={contract.order.image || contract.order.img_url}
                title={contract.order.title || 'Order'}
              />
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-0.5">
                  {t('contract.relatedOrder', 'Đơn hàng liên kết')}
                </span>
                <div className="font-bold text-sm text-foreground truncate">
                  {contract.order.title || ('Order #' + contract.order.id?.slice(-6))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(contract.order.totalAmount || contract.order.price || 0)}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/orders/' + (contract.order.id || contract.order._id))}
              className="shrink-0 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <span>{t('contract.viewOrder', 'Xem đơn hàng')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Related Project Card */}
        {contract.project && (
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-border bg-card flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-0.5">
                  {t('contract.relatedProject', 'Dự án liên kết')}
                </span>
                <div className="font-bold text-sm text-foreground truncate">
                  {contract.project.title || 'Project Workspace'}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {contract.project.status}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/projects/' + (contract.projectId || contract.project.id || contract.project._id))}
              className="shrink-0 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <span>{t('contract.viewProject', 'Không gian dự án')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* 4. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Participants, Terms, Scope */}
        <div className="lg:col-span-7 space-y-6">
          {/* Participants */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <span>{t('contract.contractInfo', 'Các bên tham gia hợp đồng')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Box */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border bg-muted/20 flex items-center gap-3.5">
                <Avatar
                  src={contract.buyer?.avatar}
                  fallback={(contract.buyer?.name || 'B').charAt(0).toUpperCase()}
                  className="w-12 h-12 text-sm shrink-0"
                />
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-1">
                    {t('contract.client', 'Người mua / Khách hàng')}
                  </span>
                  <div className="font-bold text-sm text-foreground truncate">
                    {contract.buyer?.name || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {contract.buyer?.email || 'buyer@workly.com'}
                  </div>
                </div>
              </div>

              {/* Freelancer Box */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border bg-muted/20 flex items-center gap-3.5">
                <Avatar
                  src={contract.freelancer?.avatar}
                  fallback={(contract.freelancer?.name || 'F').charAt(0).toUpperCase()}
                  className="w-12 h-12 text-sm shrink-0"
                />
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 mb-1">
                    {t('contract.freelancer', 'Freelancer thực hiện')}
                  </span>
                  <div className="font-bold text-sm text-foreground truncate">
                    {contract.freelancer?.name || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {contract.freelancer?.email || 'freelancer@workly.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scope & Terms */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <span>{t('contract.scopeOfWork', 'Phạm vi công việc & Điều khoản')}</span>
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('contract.termsDescription', 'Hợp đồng dịch vụ điện tử được xác lập dựa trên thỏa thuận giữa Người mua và Freelancer trên nền tảng Workly.')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  {t('contract.contractType', 'Hình thức')}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  {contractTypeLabel}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  {contract.type === 'hourly' ? t('contract.hourlyRate', 'Đơn giá / giờ') : t('contract.fixedPrice', 'Đơn giá gói')}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(contract.price || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  {t('contract.signedDate', 'Ngày ký')}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatDate(contract.startDate || contract.createdAt)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  {t('contract.deadline', 'Hạn bàn giao')}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatDate(contract.endDate || contract.order?.deliveryDeadline)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary-50/60 dark:bg-primary-950/20 border border-primary-200/60 dark:border-primary-800/40 text-xs text-muted-foreground leading-relaxed">
              {t('contract.agreementNotice', 'Hợp đồng này có hiệu lực kể từ ngày kích hoạt và được quản lý theo điều khoản dịch vụ của Workly. Mọi khoản thanh toán được bảo đảm qua hệ thống thanh toán an toàn của Workly.')}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Summary & Milestones */}
        <div className="lg:col-span-5 space-y-6">
          {/* Payment Summary Box */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600 shrink-0" />
                <h3 className="font-bold text-base text-foreground whitespace-nowrap">
                  {t('contract.paymentSummary', 'Payment Summary')}
                </h3>
              </div>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0',
                paidPercent === 100
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : paidPercent > 0
                  ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/50 dark:text-primary-300'
                  : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
              )}>
                {paidPercent === 100
                  ? t('contract.fullyPaid', 'Đã thanh toán đủ')
                  : paidPercent > 0
                  ? t('contract.partiallyPaid', 'Thanh toán một phần')
                  : t('contract.unpaid', 'Chờ thanh toán')}
              </span>
            </div>

            {/* Total, Paid, Remaining */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('contract.totalValue', 'Tổng giá trị')}:</span>
                <span className="font-extrabold text-base text-foreground">{formatCurrency(budget)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('contract.paid', 'Đã thanh toán')}:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted-foreground font-semibold">{t('contract.remaining', 'Còn lại')}:</span>
                <span className="font-extrabold text-foreground">{formatCurrency(remaining)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>{t('contract.paymentProgress', 'Tiến độ')}</span>
                <span className="text-foreground">{paidPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    paidPercent === 100
                      ? 'bg-emerald-500'
                      : paidPercent > 0
                      ? 'bg-primary-600'
                      : 'bg-slate-300 dark:bg-slate-700'
                  )}
                  style={{ width: `${Math.max(5, paidPercent)}%` }}
                />
              </div>
            </div>

            {/* Pay Milestone Action Button */}
            {isBuyer && contract.status === 'active' && remaining > 0 && (
              <Button
                onClick={() => {
                  setPayAmount(remaining.toString())
                  setShowPayModal(true)
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2 py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>{t('contract.payMilestone', 'Thanh toán hợp đồng')}</span>
              </Button>
            )}
          </div>

          {/* Payment History / Milestones */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>{t('contract.paymentHistory', 'Lịch sử thanh toán')}</span>
            </h3>

            <div className="space-y-3">
              {paidAmount > 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('contract.paymentMilestoneInitial', 'Thanh toán dịch vụ')}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDateTime(contract.updatedAt || contract.createdAt)}
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatCurrency(paidAmount)}
                  </span>
                </div>
              ) : null}

              {remaining > 0 && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-muted-foreground">
                      {t('contract.remainingBalance', 'Số dư còn lại')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {contract.status === 'completed' ? '—' : t('contract.unpaid', 'Chờ thanh toán')}
                    </div>
                  </div>
                  <span className="font-bold text-foreground">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              )}

              {paidAmount === 0 && remaining === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {t('contract.noPaymentsYet', 'Chưa có giao dịch thanh toán nào được ghi nhận.')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <span>{t('contract.payContract', 'Thanh toán hợp đồng')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayContract} className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('contract.remaining', 'Số dư còn lại')}:</span>
                  <span className="font-bold text-foreground">{formatCurrency(remaining)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {t('contract.payAmount', 'Số tiền thanh toán')} ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={remaining}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(remaining.toString())}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                >
                  100% ({formatCurrency(remaining)})
                </button>
                {remaining >= 2 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(Number((remaining / 2).toFixed(2)).toString())}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                  >
                    50% ({formatCurrency(Number((remaining / 2).toFixed(2)))})
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPayModal(false)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  {t('workspace.close', 'Hủy')}
                </Button>
                <Button
                  type="submit"
                  disabled={paying}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold gap-2 cursor-pointer"
                >
                  {paying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('orderDetail.processing', 'Đang xử lý...')}</span>
                    </>
                  ) : (
                    <span>{t('contract.payNow', 'Thanh toán ngay')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Contract Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-foreground">
                  {t('contract.cancelContractConfirmTitle', 'Xác nhận hủy hợp đồng')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingContract}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <p>
                {t('contract.cancelContractConfirmDesc', 'Khi bạn hủy hợp đồng này, toàn bộ Đơn hàng và Không gian dự án liên kết cũng sẽ bị hủy bỏ. Bạn có chắc chắn muốn tiếp tục?')}
              </p>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ {t('orderDetail.irreversibleNotice', 'Hành động này không thể hoàn tác sau khi đã xác nhận.')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingContract}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('common.cancel', 'Bỏ qua')}
              </Button>
              <Button
                type="button"
                disabled={cancellingContract}
                onClick={handleCancelContract}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
              >
                {cancellingContract ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('contract.cancellingContract', 'Đang hủy...')}</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>{t('contract.cancelContract', 'Hủy hợp đồng')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
