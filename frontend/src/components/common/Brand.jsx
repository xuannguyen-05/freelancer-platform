import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

const sizeStyles = {
  sm: {
    image: 'h-8 w-8',
    wordmark: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    image: 'h-9 w-9',
    wordmark: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    image: 'h-11 w-11',
    wordmark: 'text-2xl',
    gap: 'gap-3',
  },
}

export default function Brand({ size = 'md', className = '' }) {
  const styles = sizeStyles[size]

  return (
    <Link
      to="/"
      className={`group inline-flex shrink-0 items-center ${styles.gap} ${className}`}
      aria-label="Workly home"
      onClick={() => window.scrollTo(0, 0)}
    >
      <span className="relative grid place-items-center">
        <img
          src={logo}
          alt="Workly"
          className={`${styles.image} object-contain transition duration-200 ease-out group-hover:-rotate-2 group-hover:scale-[1.04]`}
        />
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent-500 ring-2 ring-card" aria-hidden="true" />
      </span>
      <span className={`workly-wordmark ${styles.wordmark} font-extrabold leading-none text-primary-600 transition-colors duration-200 group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300`}>
        Workly
      </span>
    </Link>
  )
}
