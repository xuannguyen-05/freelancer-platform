import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import {
  Moon,
  Sun,
  LogOut,
  Menu,
  ChevronDown,
  X,
  Sparkles,
  MessageSquare,
  Bell,
  Search,
  Globe,
  ShoppingBag,
  FolderKanban,
  CheckCircle2,
  CreditCard,
  Star,
  Ban,
  CheckCheck
} from 'lucide-react'
import { Avatar, Button } from '../components/ui'
import Brand from '../components/common/Brand'
import Footer from '../components/landing/Footer'
import { conversationService } from '../services/conversationService'
import { notificationService } from '../services/notificationService'
import { formatCurrency } from '../utils/format'
import { cn } from '../utils/cn'

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Admin users must never access or render Buyer/Freelancer workspace
  if (user?.role === 'admin') {
    return <Navigate to="/admin/overview" replace />
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  // Fetch real notifications for authenticated user
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const res = await notificationService.getNotifications({ limit: 20 })
      if (res?.data) {
        setNotifications(res.data.notifications || [])
        setUnreadNotifications(res.data.unreadCount || 0)
      }
    } catch (e) {
      // Silently ignore if unauthenticated or network error
    }
  }

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadNotifications(0)
      return
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000)
    return () => clearInterval(interval)
  }, [user])

  // Refresh notifications when popover is opened
  useEffect(() => {
    if (notificationsOpen && user) {
      fetchNotifications()
    }
  }, [notificationsOpen])

  const handleMarkAllAsRead = async () => {
    if (unreadNotifications === 0) return
    setUnreadNotifications(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await notificationService.markAllAsRead()
    } catch (e) {
      fetchNotifications()
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      setUnreadNotifications((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      )
      try {
        await notificationService.markAsRead(notif._id)
      } catch (e) {}
    }
    setNotificationsOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return t('workspace.justNow', 'Vừa xong')
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const getNotificationDetails = (notif) => {
    const meta = notif.metadata || {}
    const type = notif.type

    const title = t(`notification.type_${type}_title`, 'Thông báo')
    const message = t(`notification.type_${type}_desc`, {
      actorName: meta.actorName || notif.sender?.name || (i18n.language === 'vi' ? 'Đối tác' : 'Partner'),
      gigTitle: meta.gigTitle || '',
      orderCode: meta.orderCode || '',
      projectTitle: meta.projectTitle || '',
      taskTitle: meta.taskTitle || '',
      contractCode: meta.contractCode || '',
      amount: meta.amount ? formatCurrency(meta.amount) : '',
      rating: meta.rating || 5,
      reason: meta.reason || '',
    })

    let icon = Bell
    let iconClass = 'text-primary-600 bg-primary-50 dark:bg-primary-950/50'

    switch (type) {
      case 'order_created':
      case 'order_cancelled':
        icon = ShoppingBag
        iconClass =
          type === 'order_created'
            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
            : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
        break
      case 'project_created':
      case 'member_added':
      case 'member_removed':
        icon = FolderKanban
        iconClass = 'text-blue-600 bg-blue-50 dark:bg-blue-950/50'
        break
      case 'task_assigned':
      case 'task_completed':
        icon = CheckCircle2
        iconClass =
          type === 'task_completed'
            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
            : 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
        break
      case 'payment_received':
        icon = CreditCard
        iconClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
        break
      case 'contract_cancelled':
        icon = Ban
        iconClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
        break
      case 'review_received':
        icon = Star
        iconClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
        break
      case 'freelancer_approved':
        icon = CheckCircle2
        iconClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
        break
      case 'freelancer_rejected':
        icon = Ban
        iconClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
        break
      default:
        icon = Bell
        iconClass = 'text-primary-600 bg-primary-50 dark:bg-primary-950/50'
    }

    return { title, message, icon, iconClass }
  }

  // Fetch real unread message count for authenticated user
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0)
      return
    }

    let isMounted = true
    const fetchUnread = async () => {
      try {
        const res = await conversationService.getUnreadCount()
        if (isMounted && typeof res?.data?.unreadCount === 'number') {
          setUnreadMessages(res.data.unreadCount)
        }
      } catch (e) {
        // Silently ignore if unauthenticated or network error
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user, location.pathname])

  // Reset scroll to top on route changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setAccountMenuOpen(false)
    setMobileMenuOpen(false)
    logout()
    navigate('/')
  }

  const toggleLanguage = () => {
    const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').toLowerCase()
    const newLang = currentLang.startsWith('vi') ? 'en' : 'vi'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const isTalentView = new URLSearchParams(location.search).get('view') === 'talent'

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (isTalentView) {
      navigate(q ? `/app/home?view=talent&search=${encodeURIComponent(q)}` : '/app/home?view=talent')
    } else {
      navigate(q ? `/app/home?search=${encodeURIComponent(q)}` : '/app/home')
    }
  }

  const handleExploreClick = (e) => {
    if (location.pathname === '/app/home') {
      if (isTalentView) {
        navigate('/app/home')
      } else {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('workly-scroll-services'))
      }
    } else {
      navigate('/app/home#services')
    }
  }

  const handleMessageClick = (e) => {
    e.preventDefault()
    if (location.pathname === '/app/messages') {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1)
      } else {
        navigate('/app/home')
      }
    } else {
      navigate('/app/messages')
    }
  }

  // Determine Buyer vs Freelancer role dynamically from auth state
  const role = (user?.role || 'buyer').toLowerCase()
  const isFreelancer = role === 'freelancer'
  const isBuyer = !isFreelancer

  // Navigation items for Buyer dropdown
  const buyerNavItems = [
    { label: t('nav.profile', 'Profile'), path: '/app/profile' },
    { label: t('nav.myOrders', 'My Orders'), path: '/app/orders' },
    { label: t('nav.projects', 'Projects'), path: '/app/projects' },
    { label: t('nav.contracts', 'Contracts'), path: '/app/contracts' },
    { label: t('nav.reviews', 'Reviews'), path: '/app/reviews' },
  ]

  // Navigation items for Freelancer dropdown
  const freelancerNavItems = [
    { label: t('nav.profile', 'Profile'), path: '/app/profile' },
    { label: t('nav.myGigs', 'My Gigs'), path: '/app/gigs' },
    { label: t('nav.orders', 'Orders'), path: '/app/orders' },
    { label: t('nav.projects', 'Projects'), path: '/app/projects' },
    { label: t('nav.contracts', 'Contracts'), path: '/app/contracts' },
    { label: t('nav.reviews', 'Reviews'), path: '/app/reviews' },
  ]

  const dropdownItems = isFreelancer ? freelancerNavItems : buyerNavItems

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Global Marketplace Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left: Logo & Navigation */}
          <div className="flex shrink-0 items-center gap-6 lg:gap-8">
            <Brand size="sm" />

            <nav className="hidden items-center gap-5 md:flex lg:gap-6">
              <Link
                to="/app/home"
                onClick={handleExploreClick}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-foreground',
                  (location.pathname === '/app/home' && !isTalentView) || location.pathname === '/app/gigs'
                    ? 'font-semibold text-primary-600'
                    : 'text-muted-foreground'
                )}
              >
                {t('nav.explore', 'Explore')}
              </Link>

              {(!user || isBuyer) && (
                <Link
                  to="/app/home?view=talent"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-foreground',
                    location.pathname === '/app/home' && isTalentView
                      ? 'font-semibold text-primary-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {t('nav.findTalent', 'Find Talent')}
                </Link>
              )}

              <Link
                to="/app/top-talent"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-foreground',
                  location.pathname === '/app/top-talent'
                    ? 'font-semibold text-primary-600'
                    : 'text-muted-foreground'
                )}
              >
                {t('nav.topTalent', 'Top Talent')}
              </Link>
            </nav>
          </div>

          {/* Center: Compact Global Search Field */}
          <form
            onSubmit={handleGlobalSearch}
            className="hidden flex-1 max-w-sm sm:flex md:max-w-md mx-2 lg:mx-6"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder', 'Search services...')}
                className="h-9 w-full rounded-xl border border-border/80 bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition hover:bg-muted focus:border-primary-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </form>

          {/* Right: Actions, Messages, Notifications, Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme & Language (Globe) Toggles */}
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5 stroke-[1.75]" /> : <Sun className="h-4.5 w-4.5 stroke-[1.75]" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Toggle language"
            >
              <Globe className="h-4.5 w-4.5 stroke-[1.75]" />
            </button>

            {user ? (
              <>
                {/* 💬 Messages Icon Button */}
                <button
                  type="button"
                  onClick={handleMessageClick}
                  className={cn(
                    'relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer',
                    location.pathname === '/app/messages' &&
                      'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 font-semibold'
                  )}
                  aria-label={t('message.messages', 'Messages')}
                  title={location.pathname === '/app/messages' ? (i18n.language === 'vi' ? 'Thoát tin nhắn' : 'Exit messages') : t('message.messages', 'Messages')}
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow-xs">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </button>

                {/* 🔔 Notifications Icon Button */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className={cn(
                      'relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer',
                      notificationsOpen && 'bg-accent text-foreground'
                    )}
                    aria-label={t('notification.notifications', 'Notifications')}
                    title={t('notification.notifications', 'Notifications')}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {t('notification.notifications', 'Notifications')}
                          </p>
                          {unreadNotifications > 0 && (
                            <span className="rounded-full bg-primary-100 dark:bg-primary-950/60 px-2 py-0.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                              {unreadNotifications}
                            </span>
                          )}
                        </div>
                        {unreadNotifications > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline transition-colors cursor-pointer"
                          >
                            {t('notification.markAllAsRead', 'Mark all as read')}
                          </button>
                        )}
                      </div>

                      {notifications.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
                          {notifications.map((notif) => {
                            const { title, message, icon: IconComponent, iconClass } = getNotificationDetails(notif)
                            return (
                              <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={cn(
                                  'flex items-start gap-3 p-3.5 hover:bg-accent/60 cursor-pointer transition-colors text-left',
                                  !notif.isRead && 'bg-primary-50/30 dark:bg-primary-950/20'
                                )}
                              >
                                <div className={cn('p-2 rounded-xl shrink-0 mt-0.5', iconClass)}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className={cn('text-xs truncate font-medium text-foreground', !notif.isRead && 'font-semibold')}>
                                      {title}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                      {formatTimeAgo(notif.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {message}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 self-center" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                            <Bell className="w-5 h-5 opacity-60" />
                          </div>
                          <p className="text-xs font-semibold text-foreground">
                            {t('notification.noNotifications', 'No notifications yet')}
                          </p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            {t('notification.noNotificationsDesc', 'You will receive notifications here for updates on your orders and projects.')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar Dropdown Trigger — Rounded pill with light grey background */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-muted/70 dark:hover:bg-muted p-1 pr-2.5 sm:pr-3 transition-colors duration-200 border border-border/40',
                      accountMenuOpen && 'bg-slate-200/90 dark:bg-muted'
                    )}
                    aria-expanded={accountMenuOpen}
                    aria-label={t('common.account', 'Account')}
                  >
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      fallback={user.name?.charAt(0) || 'U'}
                      className="h-7 w-7 ring-1 ring-border/50"
                    />
                    <span className="hidden max-w-28 truncate text-sm font-medium text-foreground md:inline">
                      {user.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                        accountMenuOpen && 'rotate-180 text-foreground'
                      )}
                    />
                  </button>

                  {/* Compact, clean Dropdown Menu matching Image 4 */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card py-1.5 shadow-xl">
                      {/* User Header */}
                      <div className="border-b border-border/70 px-4 py-2.5">
                        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                          {user.role || 'Buyer'}
                        </p>
                      </div>

                      {/* Main Navigation Items */}
                      <div className="py-1">
                        {dropdownItems.map((item) => (
                          <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setAccountMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Buyer only: Become a Freelancer */}
                      {isBuyer && (
                        <div className="border-t border-border/70 py-1">
                          <Link
                            to="/app/become-freelancer"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/30"
                          >
                            <Sparkles className="h-4 w-4" />
                            {t('nav.becomeFreelancer', 'Become a Freelancer')}
                          </Link>
                        </div>
                      )}

                      {/* Log out */}
                      <div className="border-t border-border/70 py-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('common.logout', 'Log out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden items-center space-x-2 md:flex">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    {t('common.login', 'Log in')}
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="font-medium">
                    {t('common.register', 'Sign up')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="ml-1 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card p-4 md:hidden">
            {/* Mobile Search */}
            <form onSubmit={handleGlobalSearch} className="mb-4">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder', 'Search services...')}
                  className="h-10 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </form>

            <nav className="flex flex-col space-y-2">
              <Link
                to="/app/home"
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                  (location.pathname === '/app/home' && !isTalentView) || location.pathname === '/app/gigs'
                    ? 'font-semibold text-primary-600'
                    : 'text-foreground'
                )}
                onClick={(e) => {
                  setMobileMenuOpen(false)
                  handleExploreClick(e)
                }}
              >
                {t('nav.explore', 'Explore')}
              </Link>

              {(!user || isBuyer) && (
                <Link
                  to="/app/home?view=talent"
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                    location.pathname === '/app/home' && isTalentView
                      ? 'font-semibold text-primary-600'
                      : 'text-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.findTalent', 'Find Talent')}
                </Link>
              )}

              <Link
                to="/app/top-talent"
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                  location.pathname === '/app/top-talent'
                    ? 'font-semibold text-primary-600'
                    : 'text-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.topTalent', 'Top Talent')}
              </Link>

              {user ? (
                <>
                  <Link
                    to="/app/messages"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{t('message.messages', 'Messages')}</span>
                    </div>
                    {unreadMessages > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>

                  <div className="border-t border-border pt-2 my-1">
                    {dropdownItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {isBuyer && (
                    <Link
                      to="/app/become-freelancer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Sparkles className="h-4 w-4" />
                      {t('nav.becomeFreelancer', 'Become a Freelancer')}
                    </Link>
                  )}

                  <div className="border-t border-border pt-2 mt-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout', 'Log out')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-2 border-t border-border pt-3 mt-2">
                  <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      {t('common.login', 'Log in')}
                    </Button>
                  </Link>
                  <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-center">
                      {t('common.register', 'Sign up')}
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
