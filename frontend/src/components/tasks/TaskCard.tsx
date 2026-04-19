import { Check, Trash2, Clock } from 'lucide-react'
import type { Task } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/constants'
import { formatShortDate } from '../../utils/formatters'
import { useTaskContext } from '../../context/TaskContext'
import { deleteTask, updateTaskStatus } from '../../api/tasks'

interface TaskCardProps {
  task: Task
  dragHandleProps?: Record<string, any>
}

export function TaskCard({ task, dragHandleProps }: TaskCardProps) {
  const { dispatch } = useTaskContext()
  const statusCfg = STATUS_CONFIG[task.status]
  const priorityCfg = PRIORITY_CONFIG[task.priority]

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const updated = await updateTaskStatus(task.id, 'completed')
      dispatch({ type: 'UPDATE_TASK', payload: updated })
    } catch {}
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('确定删除此任务？')) return
    try {
      await deleteTask(task.id)
      dispatch({ type: 'DELETE_TASK', payload: task.id })
    } catch {}
  }

  return (
    <div
      {...dragHandleProps}
      onClick={() => dispatch({ type: 'SELECT_TASK', payload: task })}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityCfg.color}`}>
          {priorityCfg.label}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            {formatShortDate(task.due_date)}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'completed' && (
          <button
            onClick={handleComplete}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="完成"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
