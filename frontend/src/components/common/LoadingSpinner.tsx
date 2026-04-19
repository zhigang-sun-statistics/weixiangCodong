import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  text?: string
}

export function LoadingSpinner({ size = 24, text = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <Loader2 size={size} className="animate-spin text-blue-500" />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  )
}
