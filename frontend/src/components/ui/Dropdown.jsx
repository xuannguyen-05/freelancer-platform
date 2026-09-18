import { cn } from '../../utils/cn'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function Dropdown({ trigger, children, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg z-50',
            className
          )}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ className, children, onClick, ...props }) {
  return (
    <button
      className={cn(
        'block w-full text-left px-4 py-2 text-sm text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        className
      )}
      onClick={(e) => {
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenu({ children, className }) {
  return <div className={cn('py-1', className)}>{children}</div>
}
