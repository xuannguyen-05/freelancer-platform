import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, LogOut, User, Menu } from 'lucide-react'
import { Button } from '../components/ui'
import { useState } from 'react'

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-2xl font-bold text-primary-600">
              Freelink
            </a>
            <nav className="hidden md:flex space-x-6">
              <a href="/gigs" className="text-foreground hover:text-primary-600 transition-colors">
                {t('nav.gigs')}
              </a>
              {user && (
                <>
                  <a href="/orders" className="text-foreground hover:text-primary-600 transition-colors">
                    {t('nav.orders')}
                  </a>
                  <a href="/projects" className="text-foreground hover:text-primary-600 transition-colors">
                    {t('nav.projects')}
                  </a>
                  <a href="/messages" className="text-foreground hover:text-primary-600 transition-colors">
                    {t('nav.messages')}
                  </a>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md hover:bg-accent transition-colors text-sm font-medium"
            >
              {i18n.language === 'en' ? 'VI' : 'EN'}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                <a href="/profile" className="flex items-center space-x-2 hover:bg-accent px-3 py-2 rounded-md transition-colors">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">{user.name}</span>
                </a>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">{t('common.logout')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a href="/auth/login">
                  <Button variant="ghost" size="sm">
                    {t('common.login')}
                  </Button>
                </a>
                <a href="/auth/register">
                  <Button size="sm">{t('common.register')}</Button>
                </a>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-2">
            <a href="/gigs" className="block py-2 text-foreground hover:text-primary-600">
              {t('nav.gigs')}
            </a>
            {user && (
              <>
                <a href="/orders" className="block py-2 text-foreground hover:text-primary-600">
                  {t('nav.orders')}
                </a>
                <a href="/projects" className="block py-2 text-foreground hover:text-primary-600">
                  {t('nav.projects')}
                </a>
                <a href="/messages" className="block py-2 text-foreground hover:text-primary-600">
                  {t('nav.messages')}
                </a>
                <a href="/profile" className="block py-2 text-foreground hover:text-primary-600">
                  {t('nav.profile')}
                </a>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2026 Freelink. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
