import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Search,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  Layers,
  Clock
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import OrderThumbnail from '../components/common/OrderThumbnail'
import { contractService } from '../services/contractService'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'
import Pagination from '../components/common/Pagination'
import TypewriterText from '../components/common/TypewriterText'

export default function ContractsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const isFreelancer = user?.role === 'freelancer'

  const fetchContracts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await contractService.getMyContracts()
      setContracts(res.data || [])
    } catch (err) {
      console.error('Failed to load contracts:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [user?.role])

  // Filter tabs
  const tabs = [
    { id: 'all', label: t('contract.all', 'Tất cả') },
    { id: 'active', label: t('contract.active', 'Đang hiệu lực') },
    { id: 'completed', label: t('contract.completed', 'Đã hoàn thành') },
    { id: 'cancelled', label: t('contract.cancelled', 'Đã hủy') },
  ]

  const filteredContracts = contracts.filter((contract) => {
    // Status tab filter
    if (activeTab !== 'all' && contract.status !== activeTab) {
      return false
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const titleMatch = contract.project?.title?.toLowerCase().includes(q) || contract.order?.title?.toLowerCase().includes(q)
      const buyerMatch = contract.buyer?.name?.toLowerCase().includes(q)
      const freelancerMatch = contract.freelancer?.name?.toLowerCase().includes(q)
      const idMatch = (contract.id || contract._id)?.toLowerCase().includes(q)
      const projectIdMatch = contract.projectId?.toLowerCase().includes(q)

      if (!titleMatch && !buyerMatch && !freelancerMatch && !idMatch && !projectIdMatch) {
        return false
      }
    }

    return true
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm])

  const PAGE_SIZE = 6
  const totalPages = Math.ceil(filteredContracts.length / PAGE_SIZE) || 1
  const paginatedContracts = filteredContracts.slice(
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

  const getContractStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: t('contract.completed', 'Đã hoàn thành'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dotClass: 'bg-emerald-500',
        }
      case 'cancelled':
        return {
          label: t('contract.cancelled', 'Đã hủy'),
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/70',
          dotClass: 'bg-rose-500',
        }
      case 'active':
      default:
        return {
          label: t('contract.active', 'Đang hiệu lực'),
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70',
          dotClass: 'bg-emerald-500',
        }
    }
  }

  const handleContractClick = (contract) => {
    const contractId = contract.id || contract._id
    if (contractId) {
      navigate(`/app/contracts/${contractId}`)
    } else if (contract.projectId) {
      navigate(`/app/projects/${contract.projectId}/contract`)
    } else {
      navigate('/app/orders')
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

      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight min-h-[2.25rem]">
          <TypewriterText text={t('contract.myContracts', 'Hợp đồng của tôi')} speed={30} />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground min-h-[1.5rem]">
          <TypewriterText
            text={t('contract.myContractsSubtitle', 'Xem các hợp đồng dịch vụ đã ký kết, giá trị và tiến độ thanh toán.')}
            speed={16}
            delay={250}
          />
        </p>
      </div>

      {/* 2. Filter tabs & Search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('contract.searchContracts', 'Tìm kiếm hợp đồng...')}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 3. Contracts Content */}
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
          <Button onClick={fetchContracts} variant="outline" className="gap-2 mx-auto cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            {t('common.tryAgain', 'Thử lại')}
          </Button>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            {contracts.length === 0
              ? t('contract.noContractsFound', 'Không tìm thấy hợp đồng nào')
              : t('contract.noContractsFiltered', 'Không có hợp đồng nào trong mục này.')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {contracts.length === 0
              ? t('contract.createFromOrders', 'Hợp đồng sẽ được tự động kích hoạt khi bạn đặt hoặc nhận dịch vụ trên Workly.')
              : t('contract.searchContracts', 'Thử tìm kiếm với từ khóa khác.')}
          </p>
          {contracts.length === 0 && (
            <Button
              onClick={() => navigate('/app/orders')}
              className="mt-2 text-xs font-semibold cursor-pointer"
            >
              {t('contract.goToOrders', 'Đi đến Đơn hàng')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedContracts.map((contract) => {
            const contractId = contract.id || contract._id
            const contractCode = contractId ? `#HD${contractId.slice(-6).toUpperCase()}` : '#HD'
            const statusConfig = getContractStatusConfig(contract.status)

            const targetPerson = isFreelancer ? contract.buyer : contract.freelancer
            const personRoleLabel = isFreelancer
              ? t('contract.client', 'Khách hàng')
              : t('contract.freelancer', 'Freelancer')

            const budget = contract.budget || contract.price || 0
            const paidAmount = Number(contract.paidAmount ?? 0)
            const remaining = Math.max(0, budget - paidAmount)
            const paidPercent = budget > 0 ? Math.round((paidAmount / budget) * 100) : 0

            const title = contract.project?.title || contract.order?.title || t('workspace.serviceContract', 'Hợp đồng dịch vụ')
            const contractTypeLabel = contract.type === 'hourly'
              ? t('contract.hourly', 'Theo giờ')
              : t('contract.fixed', 'Cố định')

            const deadlineDate = contract.order?.deliveryDeadline || contract.endDate

            return (
              <div
                key={contractId}
                onClick={() => handleContractClick(contract)}
                className="group flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-border bg-card shadow-xs hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all gap-5 cursor-pointer"
              >
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <OrderThumbnail
                    src={contract.order?.gig?.img_url}
                    title={title}
                  />

                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Project/Contract Title */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                        {title}
                      </h3>
                      {/* Contract Type Pill */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shrink-0">
                        {contractTypeLabel}
                      </span>
                    </div>

                    {/* Participant row */}
                    {targetPerson && (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={targetPerson?.avatar}
                          fallback={(targetPerson?.name || 'U').charAt(0).toUpperCase()}
                          className="w-5 h-5 text-[9px] shrink-0"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {targetPerson?.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                          {personRoleLabel}
                        </span>
                      </div>
                    )}

                    {/* Meta info row: Contract code, signed date, deadline */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground pt-0.5">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {contractCode}
                      </span>
                      <span>•</span>
                      <span>
                        {t('contract.signedDate', 'Ngày ký')}: {formatDate(contract.startDate || contract.createdAt)}
                      </span>
                      {deadlineDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{t('contract.deadline', 'Hạn chót')}: {formatDate(deadlineDate)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status, Payment details & Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60 shrink-0">
                  {/* Status Badge & Payment Tag */}
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

                    {/* Payment Status Pill */}
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0',
                        paidAmount >= budget && budget > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60'
                          : paidAmount > 0
                          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-primary-200/70'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60'
                      )}
                    >
                      {paidAmount >= budget && budget > 0
                        ? t('contract.fullyPaid', 'Đã thanh toán đủ')
                        : paidAmount > 0
                        ? `${t('contract.paid', 'Đã trả')} ${paidPercent}%`
                        : t('contract.unpaid', 'Chờ thanh toán')}
                    </span>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="w-full sm:w-36 lg:w-44 space-y-1 text-left sm:text-right">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span>{t('contract.totalValue', 'Tổng giá trị')}</span>
                      <span className="font-extrabold text-foreground">{formatCurrency(budget)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

                  {/* Action Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform">
                      <span>{t('contract.openContract', 'Xem hợp đồng')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && filteredContracts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
