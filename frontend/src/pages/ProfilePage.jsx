import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  User,
  Upload,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Calendar,
  Mail,
  MapPin,
  Sparkles
} from 'lucide-react'
import { Button, Input, Textarea, Dialog } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { userService } from '../services/userService'
import { freelancerService } from '../services/freelancerService'
import { resolveMediaUrl } from '../utils/media'
import { cn } from '../utils/cn'
import TypewriterText from '../components/common/TypewriterText'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef(null)

  // Profile fields
  const [name, setName] = useState('')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('buyer')
  const [createdAt, setCreatedAt] = useState(null)

  // Freelancer specific
  const [selectedSkills, setSelectedSkills] = useState([])
  const [dbSkills, setDbSkills] = useState([])
  const [acceptOrders, setAcceptOrders] = useState(true)

  // Preferences
  const [allowContact, setAllowContact] = useState(true)
  const [showPublicSearch, setShowPublicSearch] = useState(true)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Change password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState(null)

  const isFreelancer = role === 'freelancer' || user?.role === 'freelancer'

  // Load user profile on mount
  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        const [res, skillsRes] = await Promise.all([
          userService.getProfile(),
          freelancerService.getSkills().catch(() => ({ data: [] }))
        ])
        if (!isMounted) return
        const profile = res.data || res.user || res
        const loadedSkills = skillsRes?.data || (Array.isArray(skillsRes) ? skillsRes : [])
        setDbSkills(loadedSkills)
        
        setName(profile.name || '')
        setProfessionalTitle(profile.professionalTitle || profile.freelancerProfile?.slogan || '')
        setLocation(profile.location || '')
        setBio(profile.bio || '')
        setAvatar(profile.avatar || '')
        setEmail(profile.email || '')
        setRole(profile.role || 'buyer')
        setCreatedAt(profile.createdAt || null)
        setSelectedSkills(profile.skillNames || [])
        
        if (profile.preferences) {
          setAllowContact(profile.preferences.allowDirectContact ?? true)
          setShowPublicSearch(profile.preferences.showPublicProfile ?? true)
          setAcceptOrders(profile.preferences.acceptOrders ?? true)
        }

        // Update authStore user if fields changed
        if (user) {
          setUser({ ...user, ...profile })
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load profile:', err)
        // Fallback to authStore user if API has glitch
        if (user) {
          setName(user.name || '')
          setProfessionalTitle(user.professionalTitle || user.freelancerProfile?.slogan || '')
          setLocation(user.location || '')
          setBio(user.bio || '')
          setAvatar(user.avatar || '')
          setEmail(user.email || '')
          setRole(user.role || 'buyer')
          setCreatedAt(user.createdAt || null)
          setSelectedSkills(user.skillNames || [])
          if (user.preferences) {
            setAllowContact(user.preferences.allowDirectContact ?? true)
            setShowPublicSearch(user.preferences.showPublicProfile ?? true)
            setAcceptOrders(user.preferences.acceptOrders ?? true)
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('File must be JPG or PNG')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // Handle Save Changes
  const handleSaveChanges = async (e) => {
    e?.preventDefault()
    setSaving(true)

    try {
      const prefs = {
        allowDirectContact: allowContact,
        showPublicProfile: showPublicSearch,
      }
      if (isFreelancer) {
        prefs.acceptOrders = acceptOrders
      }

      // If user selected a new avatar photo, send as FormData
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        formData.append('name', name)
        formData.append('location', location)
        formData.append('bio', bio)
        formData.append('preferences', JSON.stringify(prefs))
        if (isFreelancer) {
          formData.append('professionalTitle', professionalTitle)
          formData.append('skillNames', JSON.stringify(selectedSkills))
        }

        const res = await userService.updateProfile(formData)
        const updated = res.data || res
        setUser({ ...user, ...updated })
        setAvatar(updated.avatar || avatar)
        setAvatarFile(null)
        setAvatarPreview('')
      } else {
        // Send as regular JSON
        const payload = {
          name,
          location,
          bio,
          preferences: prefs,
        }
        if (isFreelancer) {
          payload.professionalTitle = professionalTitle
          payload.skillNames = selectedSkills
        }

        const res = await userService.updateProfile(payload)
        const updated = res.data || res
        setUser({ ...user, ...updated })
      }

      toast.success(t('profileSettings.updateSuccess', 'Profile updated successfully!'))
    } catch (err) {
      console.error('Update profile error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile'
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError(t('profileSettings.currentPassword', 'Current password is required'))
      return
    }

    if (newPassword.length < 6) {
      setPasswordError(t('profileSettings.passwordTooShort', 'New password must be at least 6 characters!'))
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profileSettings.passwordMismatch', 'New password and confirmation do not match!'))
      return
    }

    setPasswordLoading(true)

    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      })

      toast.success(t('profileSettings.passwordSuccess', 'Password changed successfully!'))
      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Change password error:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to change password'
      setPasswordError(msg)
      toast.error(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  // Format member since date (e.g. Dec 2021)
  const formatMemberSince = (dateStr) => {
    if (!dateStr) return 'Dec 2021'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return 'Dec 2021'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-primary-600 mb-3" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {t('common.loading', 'Loading profile...')}
        </p>
      </div>
    )
  }

  const currentDisplayAvatar = avatarPreview || (avatar ? resolveMediaUrl(avatar) : '')

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Back button */}
        <div className="mb-4">
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

        {/* Header with Title and "Save changes" Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground min-h-[2.25rem]">
              <TypewriterText text={t('profileSettings.title', 'Profile settings')} speed={30} />
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground min-h-[1.5rem]">
              <TypewriterText
                text={t('profileSettings.subtitle', 'Manage your public profile and account details.')}
                speed={16}
                delay={250}
              />
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="self-start sm:self-auto px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm bg-primary-600 hover:bg-primary-700 text-white min-w-[135px] transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>{t('profileSettings.saving', 'Saving...')}</span>
              </>
            ) : (
              <span>{t('profileSettings.saveChanges', 'Save changes')}</span>
            )}
          </Button>
        </div>

        {/* 2-Column Grid Layout matching Reference Images 4 & 5 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Profile photo */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center text-center">
              <h3 className="self-start text-sm font-bold text-foreground mb-5">
                {t('profileSettings.profilePhoto', 'Profile photo')}
              </h3>

              {/* Avatar Preview */}
              <div className="relative group">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shadow-xs">
                  {currentDisplayAvatar ? (
                    <img
                      src={currentDisplayAvatar}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground/50" />
                  )}
                </div>
              </div>

              {/* Upload button & hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 rounded-xl px-4 text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors"
              >
                {t('profileSettings.uploadPhoto', 'Upload photo')}
              </Button>

              <p className="mt-2.5 text-[11px] text-muted-foreground font-medium">
                {t('profileSettings.photoHelp', 'JPG, PNG · Max 5MB')}
              </p>
            </div>

            {/* Card 2: Account */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('profileSettings.account', 'Account')}
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                {/* Email */}
                <div className="flex items-center justify-between gap-2 py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t('profileSettings.email', 'Email')}</span>
                  <span className="font-medium text-foreground truncate max-w-[180px]" title={email}>
                    {email}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center justify-between gap-2 py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t('profileSettings.role', 'Role')}</span>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/70"
                  >
                    {isFreelancer ? 'Freelancer' : role}
                  </span>
                </div>

                {/* Member since */}
                <div className="flex items-center justify-between gap-2 py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t('profileSettings.memberSince', 'Member since')}</span>
                  <span className="font-medium text-foreground">
                    {formatMemberSince(createdAt)}
                  </span>
                </div>
              </div>

              {/* Change password button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPasswordError(null)
                    setIsPasswordModalOpen(true)
                  }}
                  className="w-full justify-center rounded-xl text-xs font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors"
                >
                  {t('profileSettings.changePassword', 'Change password')}
                </Button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: Basic information */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-foreground">
                {t('profileSettings.basicInfo', 'Basic information')}
              </h3>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t('profileSettings.fullName', 'Full name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Kim"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-2xs"
                />
              </div>

              {/* Professional title (Freelancers only) */}
              {isFreelancer && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('profileSettings.professionalTitle', 'Professional title')}
                  </label>
                  <input
                    type="text"
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder={t('profileSettings.professionalTitlePlaceholder', 'Full-Stack Engineer & React Specialist')}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-2xs"
                  />
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t('profileSettings.location', 'Location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('profileSettings.locationPlaceholder', 'San Francisco, CA')}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-2xs"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t('profileSettings.bio', 'Bio')}
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t(
                    'profileSettings.bioPlaceholder',
                    'Senior full-stack engineer with 8 years of experience building scalable web applications.'
                  )}
                  className="w-full p-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-y shadow-2xs leading-relaxed"
                />
              </div>
            </div>

            {/* Card 2: Skills (Freelancers only) */}
            {isFreelancer && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {t('profileSettings.skillsTitle', 'Skills')}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('profileSettings.skillsSubtitle', 'Select up to 10 skills that best represent your expertise.')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 rounded-full border border-primary-200/60 dark:border-primary-800/60">
                    {t('profileSettings.selectedCount', '{{count}}/10 selected', { count: selectedSkills.length })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {dbSkills.map((s) => {
                    const skillName = typeof s === 'string' ? s : (s.name || '')
                    if (!skillName) return null
                    const isSelected = selectedSkills.includes(skillName)
                    return (
                      <button
                        key={s._id || s.id || skillName}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkills(selectedSkills.filter((item) => item !== skillName))
                          } else {
                            if (selectedSkills.length >= 10) {
                              toast.error(t('profileSettings.maxSkillsWarning', 'You can select up to 10 skills.'))
                              return
                            }
                            setSelectedSkills([...selectedSkills, skillName])
                          }
                        }}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer',
                          isSelected
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        {skillName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Card 3: Preferences */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-foreground">
                {t('profileSettings.preferences', 'Preferences')}
              </h3>

              <div className="space-y-4">
                {/* Toggle 1: Allow buyers to contact */}
                <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => setAllowContact(!allowContact)}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowContact}
                    className={cn(
                      'w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none',
                      allowContact
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
                        allowContact ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    {t('profileSettings.allowContact', 'Allow buyers to contact me directly')}
                  </span>
                </div>

                {/* Toggle 2: Show profile in public search */}
                <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => setShowPublicSearch(!showPublicSearch)}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showPublicSearch}
                    className={cn(
                      'w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none',
                      showPublicSearch
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
                        showPublicSearch ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    {t('profileSettings.showPublicSearch', 'Show profile in public search')}
                  </span>
                </div>

                {/* Toggle 3: Accept new orders (Freelancers only) */}
                {isFreelancer && (
                  <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => setAcceptOrders(!acceptOrders)}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={acceptOrders}
                      className={cn(
                        'w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none',
                        acceptOrders
                          ? 'bg-primary-600 dark:bg-primary-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
                          acceptOrders ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {t('profileSettings.acceptOrders', 'Accept new orders')}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* CHANGE PASSWORD DIALOG */}
      <Dialog
        open={isPasswordModalOpen}
        onClose={() => {
          if (!passwordLoading) {
            setIsPasswordModalOpen(false)
            setPasswordError(null)
          }
        }}
        className="max-w-md p-6 rounded-3xl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t('profileSettings.changePasswordTitle', 'Change password')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('profileSettings.changePasswordDesc', 'Enter your current password and choose a secure new one.')}
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                {t('profileSettings.currentPassword', 'Current password')}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                {t('profileSettings.newPassword', 'New password')}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                {t('profileSettings.confirmNewPassword', 'Confirm new password')}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={passwordLoading}
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-xs font-semibold"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={passwordLoading}
                className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white min-w-[130px]"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>{t('profileSettings.updatingPassword', 'Updating...')}</span>
                  </>
                ) : (
                  <span>{t('profileSettings.updatePasswordBtn', 'Update password')}</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
