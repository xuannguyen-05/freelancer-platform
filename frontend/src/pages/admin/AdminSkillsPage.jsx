import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle,
  Folder
} from 'lucide-react'
import toast from 'react-hot-toast'
import { skillService } from '../../services/skillService'
import { categoryService } from '../../services/categoryService'

export default function AdminSkillsPage() {
  const { t } = useTranslation()

  const [skills, setSkills] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [formData, setFormData] = useState({ name: '', categoryId: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skillsRes, catRes] = await Promise.all([
        skillService.getSkills(),
        categoryService.getCategories()
      ])
      if (skillsRes?.data) setSkills(skillsRes.data)
      if (catRes?.data) setCategories(catRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch skills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setEditingSkill(null)
    setFormData({ name: '', categoryId: categories[0]?._id || '' })
    setModalOpen(true)
  }

  const openEditModal = (skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name || '',
      categoryId: skill.categoryId?._id || skill.categoryId || ''
    })
    setModalOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error(t('admin.skills.nameRequired', 'Tên kỹ năng không được để trống'))
      return
    }
    if (!formData.categoryId) {
      toast.error(t('admin.skills.categoryRequired', 'Vui lòng chọn danh mục cho kỹ năng'))
      return
    }

    setIsSubmitting(true)
    try {
      if (editingSkill) {
        await skillService.updateSkill(editingSkill._id, formData)
        toast.success(t('admin.skills.updateSuccess', 'Cập nhật kỹ năng thành công!'))
      } else {
        await skillService.createSkill(formData)
        toast.success(t('admin.skills.createSuccess', 'Tạo kỹ năng mới thành công!'))
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteModal = (skill) => {
    setSkillToDelete(skill)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!skillToDelete) return
    setIsDeleting(true)
    try {
      await skillService.deleteSkill(skillToDelete._id)
      toast.success(t('admin.skills.deleteSuccess', 'Xóa kỹ năng thành công!'))
      setDeleteModalOpen(false)
      fetchData()
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'SKILL_IN_USE') {
        toast.error(t('admin.skills.deleteBlockedUsers', 'Không thể xóa: Đang có Freelancer sử dụng kỹ năng này.'))
      } else {
        toast.error(err.response?.data?.message || err.message || 'Không thể xóa kỹ năng')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSkills = skills.filter((s) => {
    const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase())
    const catId = s.categoryId?._id || s.categoryId
    const matchesCategory = selectedCategory === 'all' || String(catId) === String(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-primary-600" />
            {t('admin.skills.title', 'Quản lý Kỹ năng')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.skills.subtitle', 'Quản lý hệ thống kỹ năng chuyên môn gắn với các danh mục dịch vụ.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('admin.skills.addSkill', 'Thêm kỹ năng')}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.skills.searchPlaceholder', 'Tìm kiếm kỹ năng...')}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">{t('admin.skills.categoryFilterLabel', 'Danh mục:')}</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t('admin.skills.filterCategory', 'Tất cả danh mục')}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <RefreshCw className="h-7 w-7 animate-spin text-primary-600" />
            <p className="text-xs text-slate-500">{t('admin.skills.loading', 'Đang tải danh sách kỹ năng...')}</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('admin.skills.emptyTitle', 'Không tìm thấy kỹ năng nào')}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('admin.skills.emptyDesc', 'Hãy thêm kỹ năng để ứng viên và Freelancer lựa chọn.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">{t('admin.skills.nameCol', 'Tên kỹ năng')}</th>
                  <th className="py-3.5 px-5">{t('admin.skills.categoryCol', 'Thuộc danh mục')}</th>
                  <th className="py-3.5 px-5 text-right">{t('admin.skills.actionsCol', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredSkills.map((sk) => (
                  <tr key={sk._id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {sk.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sk.categoryId?.name || t('admin.skills.unassigned', 'Chưa gán')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(sk)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(sk)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSkill
                  ? t('admin.skills.editModalTitle', 'Chỉnh sửa kỹ năng')
                  : t('admin.skills.addModalTitle', 'Thêm kỹ năng chuyên môn mới')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {t('admin.skills.nameLabel', 'Tên kỹ năng')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('admin.skills.namePlaceholder', 'Ví dụ: React.js, UI/UX Design...')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {t('admin.skills.categoryLabel', 'Thuộc danh mục')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="" disabled>
                    {t('admin.skills.selectCategory', 'Chọn danh mục')}
                  </option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  {t('admin.common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? t('admin.common.saving', 'Đang lưu...') : editingSkill ? t('admin.common.save', 'Lưu thay đổi') : t('admin.common.create', 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('admin.skills.deleteModalTitle', 'Xác nhận xóa kỹ năng')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.skills.deleteModalDesc', { name: skillToDelete.name, defaultValue: `Bạn có chắc chắn muốn xóa kỹ năng "${skillToDelete.name}"? Thao tác này không thể hoàn tác.` })}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('admin.common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? t('admin.common.deleting', 'Đang xóa...') : t('admin.common.delete', 'Đồng ý xóa')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
