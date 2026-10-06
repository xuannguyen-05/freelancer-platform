import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import ApplicationDetailModal from './ApplicationDetailModal'

export default function AdminBecomeFreelancerPage() {
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 })

  const [selectedApp, setSelectedApp] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await adminService.getApplications({
        status: activeTab,
        search,
        page,
        limit
      })
      if (res?.data) {
        setApplications(res.data.applications || [])
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 })
        setCounts(res.data.counts || { all: 0, pending: 0, approved: 0, rejected: 0 })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [activeTab, page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchApplications()
  }

  const openDetail = (app) => {
    setSelectedApp(app)
    setModalOpen(true)
  }

  const tabs = [
    { id: 'pending', label: t('admin.applications.tabs.pending', 'Chờ duyệt'), count: counts.pending },
    { id: 'approved', label: t('admin.applications.tabs.approved', 'Đã duyệt'), count: counts.approved },
    { id: 'rejected', label: t('admin.applications.tabs.rejected', 'Đã từ chối'), count: counts.rejected },
    { id: 'all', label: t('admin.applications.tabs.all', 'Tất cả'), count: counts.all },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="h-7 w-7 text-primary-600" />
            {t('admin.applications.title', 'Phê duyệt Freelancer')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.applications.subtitle', 'Xét duyệt hồ sơ đăng ký của khách hàng để trở thành Freelancer trên Workly.')}
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="self-start sm:self-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1)
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.applications.searchPlaceholder', 'Tìm kiếm theo tên, email...')}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              {t('admin.applications.searchBtn', 'Tìm')}
            </button>
          </form>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <RefreshCw className="h-7 w-7 animate-spin text-primary-600" />
            <p className="text-xs text-slate-500">{t('admin.applications.loading', 'Đang tải danh sách hồ sơ...')}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t('admin.applications.empty', 'Không có đơn đăng ký nào')}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {t('admin.applications.emptyDesc', 'Khi có người dùng gửi hồ sơ đăng ký Freelancer, danh sách sẽ hiển thị tại đây.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">{t('admin.applications.applicant', 'Ứng viên')}</th>
                  <th className="py-3.5 px-4">{t('admin.applications.slogan', 'Tiêu đề chuyên môn')}</th>
                  <th className="py-3.5 px-4">{t('admin.applications.skills', 'Kỹ năng')}</th>
                  <th className="py-3.5 px-4">{t('admin.applications.submittedDate', 'Ngày gửi')}</th>
                  <th className="py-3.5 px-4">{t('admin.applications.status', 'Trạng thái')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.applications.actions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    onClick={() => openDetail(app)}
                    className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Applicant */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                          {app.userId?.name ? app.userId.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {app.userId?.name || 'N/A'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {app.userId?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slogan */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {app.slogan}
                      </p>
                    </td>

                    {/* Skills */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {app.skills?.slice(0, 3).map((s) => (
                          <span
                            key={s._id || s}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]"
                          >
                            {s.name || s}
                          </span>
                        ))}
                        {app.skills?.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{app.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          app.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {app.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {app.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {app.status === 'pending' && <Clock className="h-3 w-3" />}
                        {t(`admin.applications.tabs.${app.status}`, app.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openDetail(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{t('admin.applications.viewDetails', 'Xem chi tiết')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              {t('admin.applications.pageOf', {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                defaultValue: `Hiển thị trang ${pagination.page} / ${pagination.totalPages} (${pagination.total} hồ sơ)`
              })}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ApplicationDetailModal
        application={selectedApp}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStatusChanged={fetchApplications}
      />
    </div>
  )
}
