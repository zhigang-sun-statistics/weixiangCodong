import { PRIORITY_CONFIG } from '../../utils/constants'
import type { TaskPriority } from '../../types'

interface PriorityFilterProps {
  value: TaskPriority | ''
  onChange: (priority: TaskPriority | '') => void
}

export function PriorityFilter({ value, onChange }: PriorityFilterProps) {
  const options: { key: TaskPriority | ''; label: string }[] = [
    { key: '', label: '全部' },
    { key: 'high', label: PRIORITY_CONFIG.high.label },
    { key: 'medium', label: PRIORITY_CONFIG.medium.label },
    { key: 'low', label: PRIORITY_CONFIG.low.label },
  ]

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${
            value === opt.key
              ? 'bg-blue-500 text-white font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
