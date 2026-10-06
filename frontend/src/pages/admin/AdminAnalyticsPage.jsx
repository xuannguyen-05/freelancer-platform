import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { adminService } from '../../services/adminService'
import { formatCurrency } from '../../utils/format'

export default function AdminAnalyticsPage() {
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getAnalytics()
      if (res?.data) {
        setData(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm text-slate-500">{t('admin.analytics.loading', 'Đang phân tích dữ liệu hệ thống...')}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-medium">{error || t('admin.analytics.loadError', 'Không thể tải báo cáo phân tích.')}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          {t('admin.common.retry', 'Thử lại')}
        </button>
      </div>
    )
  }

  const {
    userGrowth = [],
    orderTrends = [],
    revenueTrends = [],
    topCategories = [],
    healthIndicators = {}
  } = data

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            {t('admin.analytics.title', 'Thống kê & Báo cáo Chuyên sâu')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.analytics.subtitle', 'Phân tích xu hướng tăng trưởng, đơn hàng, doanh thu và các chỉ số sức khỏe nền tảng.')}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="self-start sm:self-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Platform Health Indicators */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {t('admin.analytics.healthIndicators', 'Chỉ số sức khỏe nền tảng')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Completion Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-xs">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-2">
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {healthIndicators.completionRate || 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('admin.analytics.completionRate', 'Tỷ lệ hoàn thành đơn')}
            </p>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-xs">
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <XCircle className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {healthIndicators.cancellationRate || 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('admin.analytics.cancellationRate', 'Tỷ lệ hủy đơn')}
            </p>
          </div>

          {/* Freelancer Ratio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-xs">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-2">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {healthIndicators.freelancerRatio || 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('admin.analytics.freelancerRatio', 'Tỷ lệ Freelancer / Users')}
            </p>
          </div>

          {/* Approval Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-xs">
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center mb-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {healthIndicators.approvalRate || 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('admin.analytics.approvalRate', 'Tỷ lệ duyệt Freelancer')}
            </p>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-xs col-span-2 sm:col-span-1">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center mb-2">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(healthIndicators.averageOrderValue || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('admin.analytics.averageOrderValue', 'Giá trị đơn TB (AOV)')}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 1: Order Trends & Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Trends */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('admin.analytics.orderTrends', 'Xu hướng đơn hàng 6 tháng')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('admin.analytics.orderTrendsSubtitle', 'Hoàn thành, đang xử lý và đã hủy')}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="completed" name={t('admin.analytics.chartCompleted', 'Hoàn thành')} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name={t('admin.analytics.chartPending', 'Đang xử lý')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name={t('admin.analytics.chartCancelled', 'Đã hủy')} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('admin.analytics.revenueTrends', 'Doanh thu & Phí dịch vụ')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('admin.analytics.revenueTrendsSubtitle', 'Giá trị giao dịch đã thanh toán thành công')}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={t('admin.analytics.chartTotalRevenue', 'Tổng doanh số')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="serviceFee"
                  name={t('admin.analytics.chartServiceFee', 'Phí dịch vụ')}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#feeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: User Growth & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {t('admin.analytics.userGrowth', 'Tăng trưởng người dùng mới')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {t('admin.analytics.userGrowthSubtitle', 'Số lượng đăng ký mới theo tháng')}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="buyers" name={t('admin.analytics.chartBuyers', 'Buyers')} stroke="#4f46e5" strokeWidth={2} fill="#4f46e5" fillOpacity={0.1} />
                <Area type="monotone" dataKey="freelancers" name={t('admin.analytics.chartFreelancers', 'Freelancers')} stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {t('admin.analytics.topCategories', 'Phân bổ danh mục dịch vụ')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {t('admin.analytics.topCategoriesSubtitle', 'Tỷ trọng các ngành nghề trên sàn')}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(v) => `${v} gigs`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" name="Gigs" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
