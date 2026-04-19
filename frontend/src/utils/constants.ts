export const STATUS_CONFIG = {
  pending: { label: '待办', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
} as const

export const PRIORITY_CONFIG = {
  low: { label: '低', color: 'bg-gray-200 text-gray-600', badge: 'border-gray-300' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-700', badge: 'border-yellow-400' },
  high: { label: '高', color: 'bg-red-100 text-red-700', badge: 'border-red-400' },
} as const

export const ITEMS_PER_PAGE = 10
