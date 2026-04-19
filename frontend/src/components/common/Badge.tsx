import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  colorClass?: string
  className?: string
}

export function Badge({ children, colorClass = 'bg-gray-100 text-gray-700', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {children}
    </span>
  )
}
