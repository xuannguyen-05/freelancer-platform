import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FolderTree,
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
import { categoryService } from '../../services/categoryService'

export default function AdminCategoriesPage() {
  const { t } = useTranslation()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ categoryName: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryService.getCategories()
      if (res?.data) {
        setCategories(res.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({ categoryName: '', description: '' })
    setModalOpen(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      categoryName: cat.categoryName || cat.name || '',
      description: cat.description || ''
    })
    setModalOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.categoryName.trim()) {
      toast.error(t('admin.categories.nameRequired', 'Tên danh mục không được để trống'))
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        categoryName: formData.categoryName.trim(),
        description: formData.description?.trim() || ''
      }
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, payload)
        toast.success(t('admin.categories.updateSuccess', 'Cập nhật danh mục thành công!'))
      } else {
        await categoryService.createCategory(payload)
        toast.success(t('admin.categories.createSuccess', 'Tạo danh mục mới thành công!'))
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteModal = (cat) => {
    setCategoryToDelete(cat)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setIsDeleting(true)
    try {
      await categoryService.deleteCategory(categoryToDelete._id)
      toast.success(t('admin.categories.deleteSuccess', 'Xóa danh mục thành công!'))
      setDeleteModalOpen(false)
      fetchCategories()
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'CATEGORY_HAS_GIGS') {
        toast.error(t('admin.categories.deleteBlockedGigs', 'Không thể xóa: Đang có dịch vụ thuộc danh mục này.'))
      } else if (code === 'CATEGORY_HAS_SKILLS') {
        toast.error(t('admin.categories.deleteBlockedSkills', 'Không thể xóa: Đang có kỹ năng thuộc danh mục này.'))
      } else {
        toast.error(err.response?.data?.message || err.message || 'Không thể xóa danh mục')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredCategories = categories.filter((c) => {
    const term = search.toLowerCase()
    const name = (c.categoryName || c.name || '').toLowerCase()
    return name.includes(term) || c.description?.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderTree className="h-7 w-7 text-primary-600" />
            {t('admin.categories.title', 'Quản lý Danh mục')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.categories.subtitle', 'Quản lý cấu trúc danh mục ngành nghề, dịch vụ trên nền tảng Workly.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
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
            <span>{t('admin.categories.addCategory', 'Thêm danh mục')}</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.categories.searchPlaceholder', 'Tìm kiếm danh mục theo tên, mô tả...')}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <RefreshCw className="h-7 w-7 animate-spin text-primary-600" />
            <p className="text-xs text-slate-500">{t('admin.categories.loading', 'Đang tải danh mục...')}</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Folder className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('admin.categories.emptyTitle', 'Không tìm thấy danh mục nào')}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t('admin.categories.emptyDesc', 'Hãy tạo danh mục đầu tiên để bắt đầu phân loại dịch vụ.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">{t('admin.categories.nameCol', 'Tên danh mục')}</th>
                  <th className="py-3.5 px-5">{t('admin.categories.descCol', 'Mô tả')}</th>
                  <th className="py-3.5 px-5 text-right">{t('admin.categories.actionsCol', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                          <FolderTree className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cat.categoryName || cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 max-w-md">
                      {cat.description || <span className="italic text-slate-400">{t('admin.categories.noDesc', 'Chưa có mô tả')}</span>}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(cat)}
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
                {editingCategory
                  ? t('admin.categories.editModalTitle', 'Chỉnh sửa danh mục')
                  : t('admin.categories.addModalTitle', 'Thêm danh mục dịch vụ mới')}
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
                  {t('admin.categories.nameLabel', 'Tên danh mục')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  placeholder={t('admin.categories.namePlaceholder', 'Ví dụ: Lập trình & Công nghệ')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {t('admin.categories.descLabel', 'Mô tả ngắn gọn')}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('admin.categories.descPlaceholder', 'Mô tả về loại hình dịch vụ trong danh mục này...')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                />
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
                  {isSubmitting ? t('admin.common.saving', 'Đang lưu...') : editingCategory ? t('admin.common.save', 'Lưu thay đổi') : t('admin.common.create', 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('admin.categories.deleteModalTitle', 'Xác nhận xóa danh mục')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.categories.deleteModalDesc', { name: categoryToDelete.categoryName || categoryToDelete.name, defaultValue: `Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete.categoryName || categoryToDelete.name}"? Thao tác này không thể hoàn tác.` })}
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
