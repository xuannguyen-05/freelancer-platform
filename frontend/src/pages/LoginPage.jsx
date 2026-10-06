import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import { Input, Button } from '../components/ui'
import toast from 'react-hot-toast'
import { getAuthErrorMessage } from '../utils/authError'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setLoading(true)

    try {
      const response = await authService.login(formData)
      setAuth(response.data)
      toast.success(t('auth.loginSuccess'))
      const role = response.data?.user?.role || response.data?.role
      let destination = '/app/home'
      if (role === 'admin') {
        destination = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/overview'
      } else {
        destination = location.state?.from?.startsWith('/admin') ? '/app/home' : (location.state?.from || '/app/home')
      }
      navigate(destination, { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">{t('auth.loginEyebrow')}</p>
        <h2 className="text-3xl font-extrabold tracking-[-0.035em] text-foreground">{t('auth.loginTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('auth.loginDescription')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">{t('auth.email')}</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder={t('auth.emailPlaceholder')}
            className="rounded-xl! border-border! bg-background! py-3! text-foreground! focus:border-primary-500! focus:ring-primary-500/20!"
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
            className="rounded-xl! border-border! bg-background! py-3! text-foreground! focus:border-primary-500! focus:ring-primary-500/20!"
          />
        </div>

        <Button type="submit" className="landing-btn-lift h-12 w-full rounded-xl bg-primary-500 font-semibold shadow-md shadow-primary-500/20 hover:bg-primary-600" disabled={loading}>
          {loading ? t('common.loading') : t('auth.login')}
        </Button>
      </form>

      <div className="mt-7 border-t border-border pt-5 text-center text-sm">
        <span className="text-muted-foreground">{t('auth.dontHaveAccount')} </span>
        <Link to="/auth/register" state={location.state} className="text-primary-600 hover:underline">
          {t('auth.register')}
        </Link>
      </div>
    </div>
  )
}
