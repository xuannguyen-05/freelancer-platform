import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui'
import Brand from '../common/Brand'
import { Menu, X, Moon, Sun, Globe } from 'lucide-react'

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40'

export default function LandingHeader() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleLanguage = () => {
    const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').toLowerCase()
    const newLang = currentLang.startsWith('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const navLinks = [
    { label: t('landing.hero.secondaryCTA'), href: '#how-it-works' },
    { label: t('nav.gigs'), href: '/app/home' },
    { label: t('landing.categories.title'), href: '#categories' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/85 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-17 items-center justify-between gap-6">
          <Brand />

          <nav className="hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-primary-50/80 hover:text-primary-700"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-1.5">
            <button type="button" onClick={toggleTheme} className={iconBtnClass} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-4.5 w-4.5 stroke-[1.75]" /> : <Sun className="h-4.5 w-4.5 stroke-[1.75]" />}
            </button>
            <button type="button" onClick={toggleLanguage} className={iconBtnClass} aria-label="Toggle language">
              <Globe className="h-4.5 w-4.5 stroke-[1.75]" />
            </button>

            {user ? (
              <div className="ml-2 flex items-center border-l border-border/80 pl-3">
                <Link to={user.role === 'admin' ? '/admin/overview' : '/app/home'} onClick={() => window.scrollTo(0, 0)}>
                  <Button size="sm" className="landing-btn-lift font-semibold shadow-sm bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-500 text-white">
                    {user.role === 'admin' ? t('admin.nav.overview', 'Admin Dashboard') : t('nav.goToMarketplace')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-2 border-l border-border/80 pl-3">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="landing-btn-lift font-semibold shadow-sm bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-500">
                    {t('common.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button type="button" className={`md:hidden ${iconBtnClass}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-5 w-5 stroke-[1.75]" /> : <Menu className="h-5 w-5 stroke-[1.75]" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 py-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary-50 hover:text-primary-700"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
              <button type="button" onClick={toggleTheme} className={iconBtnClass}>
                {theme === 'light' ? <Moon className="h-4.5 w-4.5 stroke-[1.75]" /> : <Sun className="h-4.5 w-4.5 stroke-[1.75]" />}
              </button>
              <button type="button" onClick={toggleLanguage} className={iconBtnClass}>
                <Globe className="h-4.5 w-4.5 stroke-[1.75]" />
              </button>
            </div>
            {user ? (
              <div className="mt-4 border-t border-border/60 pt-4">
                <Link to={user.role === 'admin' ? '/admin/overview' : '/app/home'} onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}>
                  <Button size="sm" className="landing-btn-lift w-full font-semibold bg-primary-500 hover:bg-primary-600 text-white">
                    {user.role === 'admin' ? t('admin.nav.overview', 'Admin Dashboard') : t('nav.goToMarketplace')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full font-semibold">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="landing-btn-lift w-full font-semibold bg-primary-500 hover:bg-primary-600">
                    {t('common.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
