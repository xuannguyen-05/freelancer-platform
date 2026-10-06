import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  UserCheck,
  FolderTree,
  Sparkles,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
  ChevronDown,
  Shield
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '../hooks/useTheme'
import Brand from '../components/common/Brand'
import { adminService } from '../services/adminService'

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [pendingAppsCount, setPendingAppsCount] = useState(0)

  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Fetch pending applications count for sidebar badge
  const fetchPendingCount = async () => {
    try {
      const res = await adminService.getApplications({ status: 'pending', limit: 1 })
      if (res?.data?.counts?.pending !== undefined) {
        setPendingAppsCount(res.data.counts.pending)
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchPendingCount()
    const interval = setInterval(() => {
      fetchPendingCount()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleLanguage = () => {
    const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').toLowerCase()
    const newLang = currentLang.startsWith('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const handleLogout = () => {
    logout()
    navigate('/auth/login', { replace: true })
  }

  const navItems = [
    {
      label: t('admin.nav.overview', 'Tổng quan'),
      path: '/admin/overview',
      icon: LayoutDashboard,
    },
    {
      label: t('admin.nav.applications', 'Duyệt Freelancer'),
      path: '/admin/applications',
      icon: UserCheck,
      badge: pendingAppsCount > 0 ? pendingAppsCount : null,
    },
    {
      label: t('admin.nav.categories', 'Danh mục'),
      path: '/admin/categories',
      icon: FolderTree,
    },
    {
      label: t('admin.nav.skills', 'Kỹ năng'),
      path: '/admin/skills',
      icon: Sparkles,
    },
    {
      label: t('admin.nav.analytics', 'Thống kê & Báo cáo'),
      path: '/admin/analytics',
      icon: BarChart3,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <Brand to="/admin/overview" />
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 rounded-md border border-primary-200 dark:border-primary-800">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </div>
          </div>

          {/* Right: Language/Theme Controls & Admin User Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Change Language"
            >
              <Globe className="h-4.5 w-4.5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* User Dropdown (Admin with Logout ONLY) */}
            <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {t('admin.nav.adminRole', 'Quản trị viên')}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 rounded">
                      {t('admin.nav.adminRole', 'Quản trị viên')}
                    </span>
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('admin.nav.logout', 'Đăng xuất')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Body (Sidebar + Content) */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-64px)] p-4">
          <div className="mb-3 px-3">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Workly Admin
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Brand to="/admin/overview" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
