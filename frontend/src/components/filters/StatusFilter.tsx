import { STATUS_CONFIG } from '../../utils/constants'
import type { TaskStatus } from '../../types'

interface StatusFilterProps {
  value: TaskStatus | ''
  onChange: (status: TaskStatus | '') => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const options: { key: TaskStatus | ''; label: string }[] = [
    { key: '', label: '全部' },
    { key: 'pending', label: STATUS_CONFIG.pending.label },
    { key: 'in_progress', label: STATUS_CONFIG.in_progress.label },
    { key: 'completed', label: STATUS_CONFIG.completed.label },
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
