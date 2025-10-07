import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageLoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PageLoader({ message = 'Loading...', size = 'md', className }: PageLoaderProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  return (
    <div className={cn('flex items-center justify-center min-h-screen', className)}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface TableLoaderProps {
  rows?: number
  columns?: number
}

export function TableLoader({ rows = 5, columns = 4 }: TableLoaderProps) {
  return (
    <div className="w-full p-4 space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardLoaderProps {
  count?: number
}

export function CardLoader({ count = 6 }: CardLoaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

interface FormLoaderProps {
  fields?: number
}

export function FormLoader({ fields = 8 }: FormLoaderProps) {
  return (
    <div className="w-full space-y-4 p-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
