import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { breakdownTask } from '../../api/ai'
import { createTask } from '../../api/tasks'
import type { SubTaskItem } from '../../types'

interface TaskBreakdownProps {
  taskId: number
  title: string
  description?: string | null
}

export function TaskBreakdown({ taskId, title, description }: TaskBreakdownProps) {
  const [subtasks, setSubtasks] = useState<SubTaskItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleBreakdown() {
    setLoading(true)
    setError('')
    try {
      const result = await breakdownTask(title, description || undefined)
      setSubtasks(result)
    } catch (err: any) {
      setError(err.message || '分解失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSubtasks() {
    setCreating(true)
    try {
      for (const st of subtasks) {
        await createTask({
          title: st.title,
          description: st.description,
          tags: ['子任务'],
        })
      }
      setSubtasks([])
    } catch {} finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBreakdown}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? '分析中...' : 'AI 任务分解'}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map((st, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium">{st.title}</p>
              {st.description && <p className="text-xs text-gray-500 mt-0.5">{st.description}</p>}
            </div>
          ))}
          <button
            onClick={handleCreateSubtasks}
            disabled={creating}
            className="w-full text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
          >
            {creating ? '创建中...' : `创建 ${subtasks.length} 个子任务`}
          </button>
        </div>
      )}
    </div>
  )
}
