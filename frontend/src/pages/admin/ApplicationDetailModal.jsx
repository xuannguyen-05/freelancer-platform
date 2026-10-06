import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  User,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'

export default function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onStatusChanged
}) {
  const { t } = useTranslation()
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)

  if (!isOpen || !application) return null

  const { userId, slogan, description, skills = [], status, createdAt, reviewedBy, reviewedAt, rejectionReason: savedReason } = application

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await adminService.approveApplication(application._id)
      toast.success(t('admin.applications.approveSuccess', 'Đã phê duyệt hồ sơ Freelancer thành công!'))
      onStatusChanged?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to approve application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t('admin.applications.rejectionReason', 'Vui lòng nhập lý do từ chối'))
      return
    }

    setIsSubmitting(true)
    try {
      await adminService.rejectApplication(application._id, { reason: rejectionReason.trim() })
      toast.success(t('admin.applications.rejectSuccess', 'Đã từ chối hồ sơ thành công!'))
      onStatusChanged?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reject application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center font-bold">
              {userId?.name ? userId.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('admin.applications.modalTitle', 'Chi tiết hồ sơ ứng viên Freelancer')}
              </h3>
              <p className="text-xs text-slate-500">ID: {application._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${
                status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : status === 'rejected'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
              {status === 'rejected' && <XCircle className="h-3 w-3" />}
              {status === 'pending' && <Clock className="h-3 w-3" />}
              {t(`admin.applications.tabs.${status}`, status)}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Personal Profile */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('admin.applications.personalInfo', 'Thông tin cá nhân')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">{t('admin.applications.name', 'Họ tên')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {userId?.name || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">{t('admin.applications.email', 'Email')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {userId?.email || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">{t('admin.applications.submittedDateLabel', 'Ngày nộp đơn:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">{t('admin.applications.locationLabel', 'Khu vực:')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {userId?.location || t('admin.applications.notSpecified', 'Chưa cập nhật')}
                </span>
              </div>
            </div>

            {userId?.bio && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">{t('admin.applications.bioLabel', 'Bio:')}</p>
                <p className="text-slate-500 dark:text-slate-400">{userId.bio}</p>
              </div>
            )}
          </div>

          {/* Section 2: Professional Qualifications */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('admin.applications.professionalInfo', 'Hồ sơ chuyên môn')}
            </h4>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-1">
                  {t('admin.applications.sloganLabel', 'Tiêu đề chuyên môn (Slogan):')}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {slogan}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-1">
                  {t('admin.applications.descLabel', 'Mô tả dịch vụ / Giới thiệu năng lực:')}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  {t('admin.applications.skillsLabel', 'Kỹ năng đăng ký:')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? (
                    <span className="text-xs text-slate-400">{t('admin.applications.noSkills', 'Chưa có kỹ năng')}</span>
                  ) : (
                    skills.map((s) => (
                      <span
                        key={s._id || s}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 border border-primary-100 dark:border-primary-900"
                      >
                        {s.name || s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Review Decision Status / Actions */}
          {status === 'pending' ? (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t('admin.applications.reviewSection', 'Quyết định xét duyệt')}
              </h4>

              {rejecting ? (
                <div className="space-y-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      {t('admin.applications.rejectionReason', 'Lý do từ chối (bắt buộc)')}:
                    </label>
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      {t('admin.applications.cancelAction', 'Hủy thao tác')}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('admin.applications.rejectionReasonPlaceholder', 'Vui lòng nhập lý do từ chối cụ thể...')}
                    className="w-full text-xs p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl"
                    >
                      {t('admin.common.back', 'Quay lại')}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !rejectionReason.trim()}
                      onClick={handleReject}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs"
                    >
                      {isSubmitting ? t('admin.common.processing', 'Đang xử lý...') : t('admin.applications.confirmReject', 'Xác nhận từ chối')}
                    </button>
                  </div>
                </div>
              ) : confirmApprove ? (
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t('admin.applications.confirmApprove', 'Xác nhận duyệt hồ sơ')}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {t('admin.applications.confirmApproveDesc', 'Ứng viên sẽ được nâng cấp thành Freelancer và nhận được thông báo trong hệ thống.')}
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmApprove(false)}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl"
                    >
                      {t('admin.common.back', 'Quay lại')}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleApprove}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
                    >
                      {isSubmitting ? t('admin.common.processing', 'Đang xử lý...') : t('admin.applications.approveAction', 'Đồng ý phê duyệt')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejecting(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors"
                  >
                    {t('admin.applications.reject', 'Từ chối')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmApprove(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    {t('admin.applications.approve', 'Phê duyệt')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('admin.applications.reviewInfoTitle', 'Thông tin phê duyệt')}
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{t('admin.applications.reviewerLabel', 'Người xử lý:')}</span> {reviewedBy?.name || 'Administrator'} ({reviewedBy?.email || ''})
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{t('admin.applications.reviewedAtLabel', 'Thời gian:')}</span> {reviewedAt ? new Date(reviewedAt).toLocaleString() : 'N/A'}
                </p>
                {savedReason && (
                  <p className="text-rose-600 dark:text-rose-400">
                    <span className="font-semibold">{t('admin.applications.rejectionReasonLabel', 'Lý do từ chối:')}</span> {savedReason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
