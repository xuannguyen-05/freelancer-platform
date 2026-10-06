import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import logo from '../../assets/logo.png'

const sizeStyles = {
  sm: {
    container: 'h-8',
    image: 'h-8 w-auto',
    wordmark: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    container: 'h-9.5',
    image: 'h-9.5 w-auto',
    wordmark: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    container: 'h-11',
    image: 'h-11 w-auto',
    wordmark: 'text-2xl',
    gap: 'gap-3',
  },
  xl: {
    container: 'h-14',
    image: 'h-14 w-auto',
    wordmark: 'text-3xl',
    gap: 'gap-3.5',
  },
}

export default function Brand({ size = 'md', className = '', to, showWordmark = true }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const styles = sizeStyles[size] || sizeStyles.md

  const isInsideApp = location.pathname.startsWith('/app')
  const defaultTo = user?.role === 'admin' ? '/admin/overview' : (isInsideApp ? '/app/home' : '/')
  const targetTo = to || defaultTo

  const handleClick = () => {
    if (location.pathname === targetTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }

  return (
    <Link
      to={targetTo}
      className={`group inline-flex shrink-0 items-center select-none ${styles.gap} ${className}`}
      aria-label="Workly home"
      onClick={handleClick}
    >
      {/* Logo Icon Container with Modern Animation & Ambient Glow */}
      <span className={`relative flex items-center justify-center shrink-0 ${styles.container}`}>
        {/* Clean Ambient Radial Glow on hover (no dirty smudge at rest in light mode) */}
        <span
          className="pointer-events-none absolute -inset-2 rounded-full bg-gradient-to-tr from-blue-500/15 via-primary-500/20 to-amber-400/20 blur-lg opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:group-hover:opacity-90"
          aria-hidden="true"
        />

        {/* The New Logo Graphic with Smooth Scale & Floating Micro-interaction */}
        <img
          src={logo}
          alt="Workly"
          className={`${styles.image} relative object-contain transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_6px_14px_rgba(37,99,235,0.28)] dark:group-hover:drop-shadow-[0_6px_16px_rgba(96,165,250,0.38)]`}
        />
      </span>

      {/* Brand Wordmark with Smooth Transitions */}
      {showWordmark && (
        <span
          className={`workly-wordmark ${styles.wordmark} font-extrabold leading-none tracking-tight text-primary-600 transition-colors duration-200 group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300`}
        >
          Workly
        </span>
      )}
    </Link>
  )
}

