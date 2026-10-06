import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Briefcase,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  FolderTree,
  Sparkles,
  BarChart3,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
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

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getOverview()
      if (res?.data) {
        setData(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm text-slate-500">{t('admin.overview.loading', 'Loading admin dashboard...')}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-medium">{error || t('admin.overview.loadError', 'Unable to load dashboard data.')}</p>
        </div>
        <button
          onClick={fetchOverview}
          className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          {t('admin.common.retry', 'Retry')}
        </button>
      </div>
    )
  }

  const { stats, userGrowth = [], topCategories = [], recentActivity = [] } = data

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('admin.overview.title', 'Bảng điều khiển Quản trị')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.overview.subtitle', 'Theo dõi hiệu suất vận hành, người dùng, giao dịch và phê duyệt hồ sơ.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {stats.pendingApplications > 0 && (
            <Link
              to="/admin/applications"
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              <span>{t('admin.overview.pendingAppsBanner', { count: stats.pendingApplications, defaultValue: `${stats.pendingApplications} Hồ sơ chờ duyệt` })}</span>
            </Link>
          )}

          <button
            onClick={fetchOverview}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t('admin.common.retry', 'Refresh data')}
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('admin.overview.totalUsers', 'Tổng người dùng')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {stats.totalUsers.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="font-medium text-blue-600 dark:text-blue-400">{stats.totalFreelancers} {t('admin.overview.freelancers', 'Chuyên gia')}</span>
            <span>·</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{stats.totalBuyers} {t('admin.overview.buyers', 'Khách')}</span>
          </div>
        </div>

        {/* Active Gigs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('admin.overview.gigs', 'Dịch vụ niêm yết')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {stats.totalGigs.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {t('admin.overview.activeCategoriesCount', { count: topCategories.length, defaultValue: `Top ${topCategories.length} danh mục hoạt động` })}
          </p>
        </div>

        {/* Total Orders & Completion Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('admin.overview.orders', 'Tổng đơn hàng')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {stats.totalOrders.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {t('admin.overview.completedCount', { count: stats.completedOrders, defaultValue: `${stats.completedOrders} hoàn thành` })}
            </span>
            <span className="text-slate-400">({stats.conversionRate}%)</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('admin.overview.platformRevenue', 'Doanh thu nền tảng')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3 truncate" title={formatCurrency(stats.platformRevenue)}>
            {formatCurrency(stats.platformRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-2 truncate">
            {t('admin.overview.serviceFees', 'Phí dịch vụ')}: {formatCurrency(stats.serviceFees)}
          </p>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('admin.overview.userGrowth', 'Tăng trưởng người dùng 6 tháng gần nhất')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('admin.overview.userGrowthSubtitle', 'Phân bố số lượng Khách hàng và Chuyên gia mới đăng ký theo từng tháng')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
              {t('admin.overview.buyers', 'Khách hàng')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {t('admin.overview.freelancers', 'Chuyên gia')}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="buyerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="freelancerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="buyers"
                name={t('admin.overview.buyers', 'Khách hàng')}
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#buyerGradient)"
              />
              <Area
                type="monotone"
                dataKey="freelancers"
                name={t('admin.overview.freelancers', 'Chuyên gia')}
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#freelancerGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Top Categories & Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('admin.overview.topCategories', 'Danh mục hàng đầu')}
            </h3>
            <Link to="/admin/categories" className="text-xs font-semibold text-primary-600 hover:underline">
              {t('admin.overview.viewAll', 'Xem tất cả')}
            </Link>
          </div>

          <div className="space-y-3.5">
            {topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">{t('admin.overview.noCategories', 'Chưa có dữ liệu danh mục')}</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                      {cat.name}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {t('admin.overview.gigsCount', { count: cat.count, pct: cat.percentage, defaultValue: `${cat.count} dịch vụ (${cat.percentage}%)` })}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('admin.overview.recentActivity', 'Hoạt động gần đây')}
            </h3>
            <span className="text-xs text-slate-400">{t('admin.common.realtime', 'Thời gian thực')}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {t('admin.overview.noActivity', 'Chưa có hoạt động nào')}
              </p>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center text-xs ${
                        act.type === 'order'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                          : act.type === 'application'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      {act.type === 'order' ? (
                        <ShoppingBag className="h-4 w-4" />
                      ) : act.type === 'application' ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {act.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {act.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          {t('admin.overview.quickShortcutsTitle', 'Lối tắt quản trị nhanh')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/admin/applications')}
            className="flex flex-col items-start gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-400 hover:shadow-xs transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {t('admin.overview.shortcutApplications', 'Duyệt Freelancer')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('admin.overview.shortcutApplicationsDesc', { count: stats.pendingApplications, defaultValue: `${stats.pendingApplications} đơn đang chờ` })}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/categories')}
            className="flex flex-col items-start gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-400 hover:shadow-xs transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {t('admin.overview.shortcutCategories', 'Quản lý Danh mục')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('admin.overview.shortcutCategoriesDesc', 'Tạo và cấu trúc ngành nghề')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/skills')}
            className="flex flex-col items-start gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-400 hover:shadow-xs transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {t('admin.overview.shortcutSkills', 'Quản lý Kỹ năng')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('admin.overview.shortcutSkillsDesc', 'Taxonomy kỹ năng chuyên môn')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex flex-col items-start gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary-400 hover:shadow-xs transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {t('admin.overview.shortcutAnalytics', 'Thống kê & Báo cáo')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('admin.overview.shortcutAnalyticsDesc', 'Biểu đồ & tỷ lệ sức khỏe')}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
