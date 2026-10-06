import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  PackageCheck,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Clock,
  RefreshCw,
  FileText
} from 'lucide-react'
import { Dialog, DialogTitle, Button, Input, Textarea, Select } from '../ui'
import { categoryService } from '../../services/categoryService'
import { gigService } from '../../services/gigService'
import { resolveMediaUrl } from '../../utils/media'
import { formatCurrency } from '../../utils/format'

export default function GigFormModal({
  open,
  onClose,
  onSuccess,
  gig = null, // null for create, object for edit
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(gig)

  // Step Tabs: 0: Overview, 1: Media, 2: Packages
  const [currentTab, setCurrentTab] = useState(0)

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [categoryID, setCategoryID] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imgError, setImgError] = useState(false)

  // Packages (supports 1 to 3 packages)
  const [packages, setPackages] = useState([
    {
      title: 'Standard',
      description: t('gig.defaultPkgDesc', 'Gói tiêu chuẩn chất lượng cao hoàn thiện đầy đủ'),
      price: 50,
      deliveryDay: 3,
      revision: 2,
    },
  ])
  const [activePackageIndex, setActivePackageIndex] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Load categories
  useEffect(() => {
    if (!open) return
    let isMounted = true
    const fetchCats = async () => {
      setLoadingCategories(true)
      try {
        const res = await categoryService.getCategories()
        const list = res.data || res || []
        if (isMounted) {
          setCategories(Array.isArray(list) ? list : [])
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        if (isMounted) setLoadingCategories(false)
      }
    }
    fetchCats()
    return () => {
      isMounted = false
    }
  }, [open])

  // Populate form on open or gig change
  useEffect(() => {
    if (!open) {
      setError(null)
      setImageFile(null)
      setImagePreview('')
      setImgError(false)
      setCurrentTab(0)
      return
    }

    if (gig) {
      setTitle(gig.title || '')
      setCategoryID(
        gig.category?._id ||
          gig.category?.id ||
          (typeof gig.category === 'string' ? gig.category : '')
      )
      setDescription(gig.description || '')
      setTagsInput(Array.isArray(gig.tags) ? gig.tags.join(', ') : gig.tags || '')
      setImageUrl(gig.img_url || gig.image || '')
      setImagePreview(gig.img_url ? resolveMediaUrl(gig.img_url) : '')
      setImageFile(null)
      setImgError(false)

      if (gig.packages && gig.packages.length > 0) {
        setPackages(
          gig.packages.map((pkg) => ({
            title: pkg.title || 'Standard',
            description: pkg.description || '',
            price: Number(pkg.price) || 0,
            deliveryDay: Number(pkg.deliveryDay) || 1,
            revision: Number(pkg.revision ?? 0),
          }))
        )
      }
    } else {
      setTitle('')
      setCategoryID(categories[0]?._id || categories[0]?.id || '')
      setDescription('')
      setTagsInput('')
      setImageUrl('')
      setImageFile(null)
      setImagePreview('')
      setImgError(false)
      setPackages([
        {
          title: 'Standard',
          description: t('gig.defaultPkgDesc', 'Gói tiêu chuẩn chất lượng cao hoàn thiện đầy đủ'),
          price: 50,
          deliveryDay: 3,
          revision: 2,
        },
      ])
    }
    setActivePackageIndex(0)
    setCurrentTab(0)
    setError(null)
  }, [open, gig, categories])

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImageUrl('')
      setImgError(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Package changes
  const handlePackageChange = (index, field, value) => {
    setPackages((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addPackage = () => {
    if (packages.length >= 3) return
    const titles = ['Basic', 'Standard', 'Premium']
    const nextTitle = titles[packages.length] || `Package ${packages.length + 1}`
    const newPkg = {
      title: nextTitle,
      description: '',
      price: 30 * (packages.length + 1),
      deliveryDay: 2 * (packages.length + 1),
      revision: 1,
    }
    setPackages((prev) => [...prev, newPkg])
    setActivePackageIndex(packages.length)
  }

  const removePackage = (index, e) => {
    e?.stopPropagation()
    if (packages.length <= 1) return
    setPackages((prev) => prev.filter((_, i) => i !== index))
    setActivePackageIndex((prev) => Math.max(0, prev - 1))
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError(null)

    if (!title.trim()) {
      setCurrentTab(0)
      setError(t('gig.enterTitle', 'Vui lòng nhập tiêu đề dịch vụ'))
      return
    }

    if (!categoryID) {
      setCurrentTab(0)
      setError(t('gig.selectCategory', 'Vui lòng chọn danh mục phù hợp'))
      return
    }

    // Process tags
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // Build Payload
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('categoryID', categoryID)
    if (description.trim()) {
      formData.append('description', description.trim())
    }
    if (parsedTags.length > 0) {
      formData.append('tags', JSON.stringify(parsedTags))
    }

    if (imageFile) {
      formData.append('image', imageFile)
    } else if (imageUrl.trim()) {
      formData.append('img_url', imageUrl.trim())
    }

    // When creating, packages are required
    if (!isEdit) {
      if (!packages || packages.length === 0) {
        setCurrentTab(2)
        setError(t('gig.atLeastOnePackage', 'Phải có ít nhất 1 gói dịch vụ'))
        return
      }

      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i]
        if (!pkg.title || !pkg.title.trim()) {
          setCurrentTab(2)
          setActivePackageIndex(i)
          setError(t('gig.pkgTitleRequired', 'Gói #{{index}}: Vui lòng nhập tên gói', { index: i + 1 }))
          return
        }
        if (!pkg.price || Number(pkg.price) <= 0) {
          setCurrentTab(2)
          setActivePackageIndex(i)
          setError(t('gig.pkgPriceInvalid', 'Gói #{{index}}: Giá dịch vụ phải lớn hơn 0', { index: i + 1 }))
          return
        }
        if (!pkg.deliveryDay || Number(pkg.deliveryDay) < 1) {
          setCurrentTab(2)
          setActivePackageIndex(i)
          setError(t('gig.pkgDeliveryInvalid', 'Gói #{{index}}: Ngày giao hàng phải từ 1 ngày trở lên', { index: i + 1 }))
          return
        }
      }

      formData.append('packages', JSON.stringify(packages))
    }

    setSubmitting(true)
    try {
      let result
      if (isEdit) {
        const gigId = gig._id || gig.id
        result = await gigService.updateGig(gigId, formData)
      } else {
        result = await gigService.createGig(formData)
      }
      onSuccess?.(result)
      onClose?.()
    } catch (err) {
      console.error('Save gig error:', err)
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isEdit ? 'Failed to update gig' : 'Failed to create gig')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const currentPkg = packages[activePackageIndex] || packages[0]

  const tabs = [
    { id: 0, title: t('gig.tabOverview', '1. Thông tin chung'), icon: FileText },
    { id: 1, title: t('gig.tabMedia', '2. Hình ảnh dịch vụ'), icon: ImageIcon },
    { id: 2, title: t('gig.tabPricing', '3. Gói dịch vụ & Giá'), icon: PackageCheck },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-4xl w-full flex flex-col p-0 overflow-hidden shadow-2xl rounded-3xl border border-border bg-card"
    >
      {/* 1. Header */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border bg-card">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {isEdit ? t('gig.editGig', 'Chỉnh sửa dịch vụ') : t('gig.createNewGig', 'Tạo dịch vụ mới')}
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? t('gig.editGigDesc', 'Cập nhật thông tin chi tiết và gói giá dịch vụ của bạn.')
                : t('gig.createGigDesc', 'Đăng tải dịch vụ mới với gói giá hấp dẫn để tiếp cận khách hàng tiềm năng.')}
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Body Content (Tab-based, no cramping, no overflowing scroll) */}
      <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[65vh]">
        {error && (
          <div className="flex items-center gap-3 p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* TAB 0: Thông tin chung */}
        {currentTab === 0 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
                {t('gig.serviceTitle', 'Tiêu đề dịch vụ')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('gig.enterTitle', 'Ví dụ: Thiết kế giao diện website hiện đại chuẩn UX/UI')}
                className="w-full h-12 text-sm sm:text-base rounded-xl font-medium px-4"
                required
              />
            </div>

            {/* Category & Tags Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
                  {t('gig.serviceCategory', 'Danh mục dịch vụ')} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={categoryID}
                  onChange={(e) => setCategoryID(e.target.value)}
                  disabled={loadingCategories}
                  className="w-full h-12 text-sm rounded-xl px-3"
                >
                  <option value="" disabled>
                    {loadingCategories ? t('gig.loadingCategories', 'Đang tải danh mục...') : t('gig.selectCategory', 'Chọn danh mục phù hợp')}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>
                      {cat.categoryName || cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
                  {t('gig.serviceTags', 'Từ khóa tìm kiếm (Tags)')}
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={t('gig.tagsPlaceholder', 'Nhập từ khóa, phân cách bằng dấu phẩy (vd: logo, web, figma)')}
                  className="w-full h-12 text-sm rounded-xl px-4"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wider">
                {t('gig.serviceDescription', 'Mô tả chi tiết')}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  'gig.enterDescription',
                  'Mô tả chi tiết những gì bạn sẽ cung cấp, kinh nghiệm, quy trình làm việc, sản phẩm bàn giao...'
                )}
                rows={5}
                className="w-full text-sm sm:text-base leading-relaxed rounded-xl p-4"
              />
            </div>
          </div>
        )}

        {/* TAB 1: Hình ảnh dịch vụ */}
        {currentTab === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-w-0">
              {/* Left Box: Upload & URL (6 cols) */}
              <div className="md:col-span-6 space-y-4 flex flex-col justify-between min-w-0">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-primary-500 rounded-2xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors text-center group min-h-[180px]">
                  <Upload className="w-9 h-9 text-muted-foreground group-hover:text-primary-500 transition-colors mb-3" />
                  <span className="text-sm font-bold text-foreground">
                    {t('gig.uploadDevice', 'Tải ảnh lên từ thiết bị')}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {t('gig.uploadHelp', 'Hỗ trợ định dạng JPG, PNG, WEBP tối đa 5MB')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    {t('gig.imageUrlLabel', 'Hoặc dán liên kết ảnh trực tiếp')}
                  </label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setImagePreview(e.target.value)
                      setImageFile(null)
                      setImgError(false)
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full h-11 text-xs sm:text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Right Box: Clean Graphic Preview (6 cols) */}
              <div className="md:col-span-6 aspect-[16/10] rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/50 overflow-hidden flex flex-col items-center justify-center relative group min-w-0 p-4 text-center">
                {imagePreview && !imgError ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('')
                        setImageUrl('')
                        setImageFile(null)
                        setImgError(false)
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/75 text-white hover:bg-black transition-colors shadow-lg cursor-pointer"
                      title={t('gig.deleteImageTitle', 'Xóa ảnh này')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  /* Workly Friendly Graphic Fallback - Never displays broken image glyph! */
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2.5 p-4 max-w-xs">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shadow-xs">
                      <Layers className="w-7 h-7 stroke-[1.75]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {imgError ? t('gig.imgErrorTitle', 'Ảnh không tải được') : t('gig.noImgTitle', 'Chưa có hình ảnh')}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {imgError
                          ? t('gig.imgErrorDesc', 'Đường dẫn ảnh bị lỗi hoặc không tồn tại. Vui lòng chọn ảnh khác.')
                          : t('gig.noImgDesc', 'Hình ảnh nổi bật giúp dịch vụ của bạn thu hút khách hàng hơn.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Gói dịch vụ & Giá */}
        {currentTab === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header of packages tab */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-primary-500" />
                  {t('gig.packagePricingTitle', 'Thiết lập các gói dịch vụ')}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('gig.packagePricingDesc', 'Bạn có thể thiết lập từ 1 đến 3 gói dịch vụ tương ứng với các cấp độ khác nhau.')}
                </p>
              </div>

              {!isEdit && packages.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPackage}
                  className="rounded-xl text-xs font-bold gap-1.5 border-primary-300 dark:border-primary-700 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('gig.addPackage', 'Thêm gói dịch vụ')}</span>
                </Button>
              )}
            </div>

            {/* Package Selector Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {packages.map((pkg, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActivePackageIndex(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activePackageIndex === idx
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{pkg.title || t('gig.packageIndex', 'Gói {{index}}', { index: idx + 1 })}</span>
                    <span className="opacity-80 font-normal">
                      ({formatCurrency(pkg.price || 0)})
                    </span>
                  </button>

                  {!isEdit && packages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => removePackage(idx, e)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title={t('gig.removePackage', 'Xóa gói này')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Current Active Package Editor Card */}
            {currentPkg && (
              <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    {t('gig.packageTitle', 'Tên gói')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={currentPkg.title}
                    onChange={(e) =>
                      handlePackageChange(activePackageIndex, 'title', e.target.value)
                    }
                    placeholder="Basic / Standard / Premium"
                    className="w-full h-11 text-sm rounded-xl font-medium"
                    required
                  />
                </div>

                {/* Price, Delivery Days, Revisions in 3 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                      {t('gig.price', 'Giá ($)')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={currentPkg.price}
                        onChange={(e) =>
                          handlePackageChange(activePackageIndex, 'price', e.target.value)
                        }
                        placeholder="50"
                        className="pl-9 w-full h-11 text-sm rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                      {t('gig.deliveryDays', 'Ngày giao')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        value={currentPkg.deliveryDay}
                        onChange={(e) =>
                          handlePackageChange(activePackageIndex, 'deliveryDay', e.target.value)
                        }
                        placeholder="3"
                        className="pl-9 w-full h-11 text-sm rounded-xl font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                      {t('gig.revisions', 'Số lần sửa')}
                    </label>
                    <div className="relative">
                      <RefreshCw className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={currentPkg.revision}
                        onChange={(e) =>
                          handlePackageChange(activePackageIndex, 'revision', e.target.value)
                        }
                        placeholder={t('gig.revisionsPlaceholder', '2 (0 = không giới hạn)')}
                        className="pl-9 w-full h-11 text-sm rounded-xl font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    {t('gig.packageDescription', 'Mô tả chi tiết gói')}
                  </label>
                  <Textarea
                    value={currentPkg.description}
                    onChange={(e) =>
                      handlePackageChange(activePackageIndex, 'description', e.target.value)
                    }
                    placeholder={t('gig.packageDescPlaceholder', 'Mô tả cụ thể những gì khách hàng sẽ nhận được trong gói dịch vụ này...')}
                    rows={3}
                    className="w-full text-sm leading-relaxed rounded-xl p-3"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Bar */}
      <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-border bg-card">
        <div>
          {currentTab > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentTab((prev) => prev - 1)}
              className="text-xs h-10 px-4 rounded-xl font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('gig.prevStep', 'Quay lại')}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-10 px-4 rounded-xl font-semibold cursor-pointer"
            >
              {t('common.cancel', 'Hủy')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentTab < 2 ? (
            <Button
              type="button"
              onClick={() => setCurrentTab((prev) => prev + 1)}
              className="text-xs h-10 px-5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>{t('gig.nextStep', 'Tiếp theo')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-xs h-10 px-6 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? t('gig.saving', 'Đang lưu...') : t('gig.creating', 'Đang tạo...')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? t('gig.saveChanges', 'Lưu thay đổi') : t('gig.createGig', 'Tạo dịch vụ')}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
