import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import { Input, Button } from '../components/ui'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      toast.success(t('auth.registerSuccess'))
      navigate('/auth/login')
    } catch (error) {
      toast.error(error.response?.data?.message || t('auth.emailExists'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">{t('auth.registerEyebrow')}</p>
        <h2 className="text-3xl font-extrabold tracking-[-0.035em] text-foreground">{t('auth.registerTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('auth.registerDescription')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t('auth.name')}</label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder={t('auth.namePlaceholder')}
            className="!rounded-xl !border-border !bg-background !py-3 !text-foreground focus:!border-primary-500 focus:!ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t('auth.email')}</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder={t('auth.emailPlaceholder')}
            className="!rounded-xl !border-border !bg-background !py-3 !text-foreground focus:!border-primary-500 focus:!ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t('auth.password')}</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder={t('auth.passwordPlaceholder')}
            className="!rounded-xl !border-border !bg-background !py-3 !text-foreground focus:!border-primary-500 focus:!ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t('auth.confirmPassword')}</label>
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder={t('auth.passwordPlaceholder')}
            className="!rounded-xl !border-border !bg-background !py-3 !text-foreground focus:!border-primary-500 focus:!ring-primary-500/20"
          />
        </div>

        <Button type="submit" className="landing-btn-lift h-12 w-full rounded-xl bg-primary-500 font-semibold shadow-md shadow-primary-500/20 hover:bg-primary-600" disabled={loading}>
          {loading ? t('common.loading') : t('auth.register')}
        </Button>
      </form>

      <div className="mt-7 border-t border-border pt-5 text-center text-sm">
        <span className="text-muted-foreground">{t('auth.alreadyHaveAccount')} </span>
        <Link to="/auth/login" className="text-primary-600 hover:underline">
          {t('auth.login')}
        </Link>
      </div>
    </div>
  )
}
