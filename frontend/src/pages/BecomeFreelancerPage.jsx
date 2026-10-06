import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Zap,
  ShieldCheck,
  Search,
  User,
  X,
  Clock
} from 'lucide-react'
import { Button } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { freelancerService } from '../services/freelancerService'
import { userService } from '../services/userService'
import { resolveMediaUrl } from '../utils/media'
import { cn } from '../utils/cn'
import TypewriterText from '../components/common/TypewriterText'
import toast from 'react-hot-toast'

export default function BecomeFreelancerPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  // Role check
  const isAlreadyFreelancer = user?.role === 'freelancer'

  // Application state
  const [myApplication, setMyApplication] = useState(null)
  const [appLoading, setAppLoading] = useState(true)

  // Form states
  const [slogan, setSlogan] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')

  // Validation & Modal states
  const [fieldErrors, setFieldErrors] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Submission states
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Fetch available skills and user's application on mount
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setSkillsLoading(true)
        setAppLoading(true)
        const [skillsRes, appRes] = await Promise.all([
          freelancerService.getSkills(),
          freelancerService.getMyApplication().catch(() => null)
        ])
        if (!isMounted) return

        const list = skillsRes?.data || (Array.isArray(skillsRes) ? skillsRes : [])
        setAvailableSkills(list)

        const app = appRes?.data || null
        if (app) {
          setMyApplication(app)
          if (app.status === 'rejected') {
            // Pre-fill form from previous application
            setSlogan(app.slogan || '')
            setDescription(app.description || '')
            const skillIds = (app.skills || []).map((s) => s._id || s)
            setSelectedSkillIds(skillIds)
          }
        }
      } catch (err) {
        console.error('Failed to load skills or application:', err)
      } finally {
        if (isMounted) {
          setSkillsLoading(false)
          setAppLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  // Filter skills based on search term
  const filteredSkills = availableSkills.filter((s) => {
    if (!skillSearch.trim()) return true
    return s.name?.toLowerCase().includes(skillSearch.toLowerCase().trim())
  })

  const toggleSkill = (skillId) => {
    setSelectedSkillIds((prev) => {
      const next = prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
      if (next.length > 0) {
        setFieldErrors((e) => ({ ...e, skills: null }))
      }
      return next
    })
  }

  // Pre-validate before showing confirmation modal
  const handlePreSubmit = (e) => {
    e.preventDefault()
    setErrorMsg(null)
    const errors = {}

    const trimmedSlogan = slogan.trim()
    if (!trimmedSlogan) {
      errors.slogan = t('becomeFreelancer.sloganRequired', 'Vui lòng nhập tiêu đề chuyên môn / Khẩu hiệu.')
    } else if (trimmedSlogan.length < 5) {
      errors.slogan = t('becomeFreelancer.sloganMinLength', 'Tiêu đề chuyên môn phải có ít nhất 5 ký tự.')
    } else if (trimmedSlogan.length > 255) {
      errors.slogan = t('becomeFreelancer.sloganTooLong', 'Tiêu đề chuyên môn không được vượt quá 255 ký tự.')
    }

    if (selectedSkillIds.length === 0) {
      errors.skills = t('becomeFreelancer.skillsRequired', 'Vui lòng chọn ít nhất 1 kỹ năng chuyên môn.')
    }

    const trimmedDescription = description.trim()
    if (trimmedDescription.length > 1000) {
      errors.description = t('becomeFreelancer.descTooLong', 'Mô tả không được vượt quá 1000 ký tự.')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setShowConfirmModal(true)
  }

  // Execute confirmed submission
  const handleConfirmedSubmit = async () => {
    try {
      setSubmitting(true)
      setErrorMsg(null)

      const trimmedSlogan = slogan.trim()
      const trimmedDescription = description.trim()

      // Strict schema payload
      const payload = {
        slogan: trimmedSlogan,
        skills: selectedSkillIds,
      }
      if (trimmedDescription) {
        payload.description = trimmedDescription
      }

      // Submit application for Admin approval
      const res = await freelancerService.createProfile(payload)
      setShowConfirmModal(false)
      toast.success(
        t(
          'becomeFreelancer.submittedToast',
          'Đơn đăng ký của bạn đã được gửi thành công và đang chờ Ban quản trị phê duyệt!'
        )
      )

      if (res?.data) {
        setMyApplication(res.data)
      } else {
        const appRes = await freelancerService.getMyApplication().catch(() => null)
        if (appRes?.data) setMyApplication(appRes.data)
      }
    } catch (err) {
      console.error('Failed to become freelancer:', err)
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('becomeFreelancer.genericError', 'Kích hoạt hồ sơ không thành công. Vui lòng thử lại sau.')
      setErrorMsg(message)
      setShowConfirmModal(false)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // If already a freelancer, show polite informative screen
  if (isAlreadyFreelancer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/app/home')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('becomeFreelancer.back', 'Quay lại')}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-xs text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-5">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            {t('becomeFreelancer.activeStatus', 'Freelancer Active')}
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('becomeFreelancer.alreadyFreelancerTitle', 'Bạn đã là Freelancer')}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base leading-relaxed">
            {t(
              'becomeFreelancer.alreadyFreelancerDesc',
              'Tài khoản của bạn đã được kích hoạt quyền Freelancer. Bạn có thể tạo dịch vụ, nhận đơn hàng và ứng tuyển các dự án hấp dẫn.'
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/app/gigs')}
              className="rounded-xl px-5 py-2.5 font-semibold shadow-xs"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              {t('becomeFreelancer.goToGigs', 'Quản lý dịch vụ')}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/app/profile')}
              className="rounded-xl px-5 py-2.5 font-semibold"
            >
              <User className="mr-2 h-4 w-4" />
              {t('becomeFreelancer.goToProfile', 'Chỉnh sửa hồ sơ')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If application is pending review
  if (myApplication?.status === 'pending') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/app/home')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('becomeFreelancer.back', 'Quay lại')}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-8 sm:p-10 shadow-xs text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-5">
            <Clock className="h-8 w-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Đang chờ phê duyệt
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hồ sơ Freelancer đang được xét duyệt
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base leading-relaxed">
            Hồ sơ đăng ký của bạn đã được gửi thành công. Ban quản trị Workly đang xem xét và sẽ thông báo cho bạn ngay khi hoàn tất.
          </p>

          <div className="mt-6 max-w-md mx-auto text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2.5 shadow-xs">
            <div>
              <p className="text-slate-400 font-medium">Tiêu đề chuyên môn:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{myApplication.slogan}</p>
            </div>
            {myApplication.skills?.length > 0 && (
              <div>
                <p className="text-slate-400 font-medium mb-1">Kỹ năng đã đăng ký:</p>
                <div className="flex flex-wrap gap-1">
                  {myApplication.skills.map((s) => (
                    <span key={s._id || s} className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/50">
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Ngày gửi: {new Date(myApplication.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => navigate('/app/home')}
              className="rounded-xl px-6 py-2.5 font-semibold shadow-xs"
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const avatarUrl = user?.avatar ? resolveMediaUrl(user.avatar) : null
  const selectedSkillsData = availableSkills.filter((s) => selectedSkillIds.includes(s._id || s.id))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
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
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t('becomeFreelancer.back', 'Quay lại')}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground min-h-[2.25rem]">
            <TypewriterText text={t('becomeFreelancer.pageTitle', 'Trở thành Freelancer')} speed={30} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed min-h-[2.5rem]">
            <TypewriterText
              text={t(
                'becomeFreelancer.pageSubtitle',
                'Kích hoạt hồ sơ chuyên gia để bắt đầu cung cấp dịch vụ, tiếp cận khách hàng tiềm năng và gia tăng thu nhập trên Workly.'
              )}
              speed={16}
              delay={250}
            />
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-accent/40 rounded-xl px-3.5 py-2 border border-border/60">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>{t('becomeFreelancer.instantActivation', 'Kích hoạt ngay · Hoàn toàn miễn phí')}</span>
        </div>
      </div>

      {/* Previous application rejected notification */}
      {myApplication?.status === 'rejected' && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:p-5 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
              Đơn đăng ký trước đó của bạn đã bị từ chối
            </h4>
            {myApplication.rejectionReason && (
              <p className="text-xs font-medium">
                <span className="font-semibold">Lý do từ Ban quản trị:</span> {myApplication.rejectionReason}
              </p>
            )}
            <p className="text-xs text-rose-700 dark:text-rose-400 pt-1">
              Bạn có thể điều chỉnh lại thông tin chuyên môn hoặc kỹ năng bên dưới để gửi lại đơn xét duyệt mới.
            </p>
          </div>
        </div>
      )}

      {/* 2. Error Notification if any */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {t('becomeFreelancer.errorTitle', 'Không thể kích hoạt hồ sơ')}
            </h4>
            <p className="mt-0.5 text-xs opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Identity Preview & Value Proposition (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Identity Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('becomeFreelancer.currentAccount', 'Tài khoản đăng ký')}
            </h3>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/60">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate text-base">
                  {user?.name || t('common.user', 'User')}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={user?.email}>
                  {user?.email}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {t('becomeFreelancer.currentRole', 'Khách hàng (Buyer)')}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary-50/60 dark:bg-primary-950/20 p-3.5 border border-primary-100 dark:border-primary-900/40 text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
              <p>
                {t(
                  'becomeFreelancer.noticeRoleUpgrade',
                  'Tài khoản của bạn sẽ được nâng cấp lên Freelancer ngay sau khi xác nhận. Bạn vẫn có thể mua sắm và tạo dự án bất cứ lúc nào.'
                )}
              </p>
            </div>
          </div>

          {/* Benefits / Why Become Freelancer */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              {t('becomeFreelancer.benefitsTitle', 'Quyền lợi Freelancer')}
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-100/70 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    {t('becomeFreelancer.benefit1Title', 'Tạo và bán dịch vụ')}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {t('becomeFreelancer.benefit1Desc', 'Đăng tải các gói dịch vụ (Gigs) với mức giá và thời gian do bạn quyết định.')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    {t('becomeFreelancer.benefit2Title', 'Nhận đơn hàng trực tiếp')}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {t('becomeFreelancer.benefit2Desc', 'Khách hàng dễ dàng tìm kiếm và đặt hàng qua hồ sơ chuyên nghiệp của bạn.')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100/70 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-foreground">
                    {t('becomeFreelancer.benefit3Title', 'Thanh toán & Hợp đồng bảo đảm')}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {t('becomeFreelancer.benefit3Desc', 'Hệ thống hợp đồng và thanh toán an toàn giúp bảo vệ tối đa quyền lợi của bạn.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Freelancer Setup Form (8 cols) */}
        <div className="lg:col-span-8">
          <form onSubmit={handlePreSubmit} className="space-y-6">
            {/* Form Card */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {t('becomeFreelancer.setupTitle', 'Thiết lập thông tin hồ sơ')}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    'becomeFreelancer.setupSubtitle',
                    'Những thông tin này sẽ hiển thị công khai trên hồ sơ của bạn và giúp khách hàng tin tưởng hơn.'
                  )}
                </p>
              </div>

              {/* Field 1: Professional Title / Slogan (REQUIRED) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    {t('becomeFreelancer.sloganLabel', 'Tiêu đề chuyên môn / Khẩu hiệu')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      slogan.length > 255 ? 'text-red-500 font-bold' : 'text-muted-foreground'
                    )}
                  >
                    {slogan.length}/255
                  </span>
                </div>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => {
                    setSlogan(e.target.value)
                    if (fieldErrors.slogan) {
                      setFieldErrors((prev) => ({ ...prev, slogan: null }))
                    }
                  }}
                  placeholder={t(
                    'becomeFreelancer.sloganPlaceholder',
                    'VD: Senior Full-Stack Developer & Chuyên gia UI/UX'
                  )}
                  maxLength={255}
                  className={cn(
                    'w-full h-11 px-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all shadow-2xs',
                    fieldErrors.slogan
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-border focus:border-primary-500 focus:ring-primary-500/20'
                  )}
                />
                {fieldErrors.slogan ? (
                  <p className="text-[11px] font-medium text-red-500">{fieldErrors.slogan}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      'becomeFreelancer.sloganHelp',
                      'Một dòng tóm tắt ngắn gọn vị trí hoặc chuyên môn chính của bạn (tối thiểu 5 ký tự).'
                    )}
                  </p>
                )}
              </div>

              {/* Field 2: Professional Overview / Description (OPTIONAL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    {t('becomeFreelancer.descriptionLabel', 'Giới thiệu bản thân & Kinh nghiệm')}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({t('becomeFreelancer.optional', 'Tùy chọn')})
                    </span>
                  </label>
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      description.length > 1000 ? 'text-red-500 font-bold' : 'text-muted-foreground'
                    )}
                  >
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({ ...prev, description: null }))
                    }
                  }}
                  placeholder={t(
                    'becomeFreelancer.descriptionPlaceholder',
                    'Mô tả kinh nghiệm thực chiến, các dự án tiêu biểu, thế mạnh chuyên môn và giá trị bạn cam kết mang lại cho khách hàng...'
                  )}
                  maxLength={1000}
                  className={cn(
                    'w-full p-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all resize-y shadow-2xs leading-relaxed',
                    fieldErrors.description
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-border focus:border-primary-500 focus:ring-primary-500/20'
                  )}
                />
                {fieldErrors.description ? (
                  <p className="text-[11px] font-medium text-red-500">{fieldErrors.description}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      'becomeFreelancer.descriptionHelp',
                      'Hồ sơ chi tiết giúp tăng tỷ lệ được khách hàng liên hệ và chốt hợp đồng.'
                    )}
                  </p>
                )}
              </div>

              {/* Field 3: Skills Selector (REQUIRED) */}
              <div className="space-y-3 pt-1 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      {t('becomeFreelancer.skillsLabel', 'Kỹ năng chuyên môn')}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t(
                        'becomeFreelancer.skillsHelp',
                        'Chọn ít nhất 1 kỹ năng phù hợp nhất với chuyên môn của bạn.'
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'self-start sm:self-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                      selectedSkillIds.length > 0
                        ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 border-primary-200/60 dark:border-primary-800/60'
                        : 'text-muted-foreground bg-muted border-border'
                    )}
                  >
                    {t('becomeFreelancer.selectedCount', 'Đã chọn {{count}} kỹ năng', {
                      count: selectedSkillIds.length,
                    })}
                  </span>
                </div>

                {fieldErrors.skills && (
                  <p className="text-[11px] font-medium text-red-500">{fieldErrors.skills}</p>
                )}

                {/* Search input for skills */}
                {availableSkills.length > 8 && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder={t('becomeFreelancer.searchSkills', 'Tìm kiếm kỹ năng...')}
                      className="h-9 w-full rounded-xl border border-border bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                    />
                  </div>
                )}

                {/* Skills Grid */}
                {skillsLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {t('common.loading', 'Đang tải danh sách kỹ năng...')}
                  </div>
                ) : availableSkills.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    {t('becomeFreelancer.noSkillsFound', 'Chưa có dữ liệu kỹ năng trên hệ thống.')}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredSkills.map((skill) => {
                      const skillId = skill._id || skill.id
                      const isSelected = selectedSkillIds.includes(skillId)
                      return (
                        <button
                          key={skillId}
                          type="button"
                          onClick={() => toggleSkill(skillId)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5',
                            isSelected
                              ? 'bg-primary-600 text-white shadow-xs hover:bg-primary-700'
                              : 'bg-muted/70 hover:bg-muted text-foreground/80 hover:text-foreground border border-border/60'
                          )}
                        >
                          <span>{skill.name}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/home')}
                className="w-full sm:w-auto rounded-xl px-6 py-2.5 font-medium"
              >
                {t('common.cancel', 'Hủy')}
              </Button>

              <Button
                type="submit"
                className="w-full sm:w-auto rounded-xl px-7 py-2.5 font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t('becomeFreelancer.submitBtn', 'Kích hoạt hồ sơ Freelancer')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t('becomeFreelancer.confirmModalTitle', 'Xác nhận kích hoạt tài khoản')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('becomeFreelancer.confirmModalSubtitle', 'Trở thành Freelancer trên sàn Workly')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content Preview */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium">
                  {t('becomeFreelancer.sloganLabel', 'Tiêu đề')}
                </span>
                <span className="font-bold text-foreground text-right">{slogan.trim()}</span>
              </div>

              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium">
                  {t('becomeFreelancer.skillsLabel', 'Kỹ năng')}
                </span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                  {selectedSkillsData.map((s) => (
                    <span
                      key={s._id || s.id}
                      className="px-2 py-0.5 rounded-md bg-card text-foreground border border-border/60 text-[11px] font-semibold"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {description.trim() && (
                <div className="pt-1">
                  <span className="text-muted-foreground font-medium block mb-1">
                    {t('becomeFreelancer.descriptionLabel', 'Giới thiệu')}
                  </span>
                  <p className="text-foreground/90 line-clamp-3 italic text-[11px] leading-relaxed">
                    "{description.trim()}"
                  </p>
                </div>
              )}
            </div>

            {/* Explanatory note */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'becomeFreelancer.confirmModalNote',
                'Sau khi kích hoạt, thanh điều hướng của bạn sẽ chuyển sang giao diện Freelancer để bắt đầu quản lý dịch vụ và nhận đơn hàng. Bạn vẫn có thể mua sắm bình thường.'
              )}
            </p>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto rounded-xl text-xs font-semibold px-5"
              >
                {t('becomeFreelancer.reviewBtn', 'Xem lại thông tin')}
              </Button>

              <Button
                type="button"
                disabled={submitting}
                onClick={handleConfirmedSubmit}
                className="w-full sm:w-auto rounded-xl text-xs font-bold px-6 shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('becomeFreelancer.submitting', 'Đang kích hoạt...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('becomeFreelancer.confirmSubmitBtn', 'Đồng ý kích hoạt')}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
