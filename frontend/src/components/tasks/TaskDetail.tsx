import { useState } from 'react'
import { X, Edit3, Trash2, Check, Clock, Tag, Sparkles, Loader2 } from 'lucide-react'
import type { Task } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/constants'
import { formatDate } from '../../utils/formatters'
import { useTaskContext } from '../../context/TaskContext'
import { deleteTask, updateTaskStatus } from '../../api/tasks'
import { detectSimilar } from '../../api/ai'
import { TaskForm } from './TaskForm'
import { TaskBreakdown } from '../ai/TaskBreakdown'

interface TaskDetailProps {
  task: Task
  onClose: () => void
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { dispatch } = useTaskContext()
  const [editing, setEditing] = useState(false)

  // TODO-05: similar task detection
  const [similarTasks, setSimilarTasks] = useState<{ task_id: number; title: string; similarity_reason: string }[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [similarError, setSimilarError] = useState('')

  const statusCfg = STATUS_CONFIG[task.status]
  const priorityCfg = PRIORITY_CONFIG[task.priority]

  if (editing) {
    return <TaskForm onClose={() => setEditing(false)} editTask={task} />
  }

  async function handleComplete() {
    try {
      const updated = await updateTaskStatus(task.id, 'completed')
      dispatch({ type: 'UPDATE_TASK', payload: updated })
    } catch {}
  }

  async function handleDelete() {
    if (!confirm('确定删除此任务？')) return
    try {
      await deleteTask(task.id)
      dispatch({ type: 'DELETE_TASK', payload: task.id })
      onClose()
    } catch {}
  }

  async function handleDetectSimilar() {
    setSimilarLoading(true)
    setSimilarError('')
    try {
      const results = await detectSimilar(task.id)
      setSimilarTasks(results)
    } catch (err: any) {
      setSimilarError(err.message || '检测失败')
    } finally {
      setSimilarLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-xl overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate">{task.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${statusCfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${priorityCfg.color}`}>
              {priorityCfg.label}优先级
            </span>
          </div>

          {task.description && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">描述</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">标签</h4>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    <Tag size={10} />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.due_date && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">截止时间</h4>
              <p className="flex items-center gap-1 text-sm text-gray-700">
                <Clock size={14} />{formatDate(task.due_date)}
              </p>
            </div>
          )}

          {/* TODO-02: TaskBreakdown integration */}
          {task.status !== 'completed' && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">AI 工具</h4>
              <TaskBreakdown
                taskId={task.id}
                title={task.title}
                description={task.description}
              />
            </div>
          )}

          {/* TODO-05: Similar task detection */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">相似任务</h4>
            <button
              onClick={handleDetectSimilar}
              disabled={similarLoading}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {similarLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {similarLoading ? '检测中...' : '检测相似任务'}
            </button>

            {similarError && <p className="text-xs text-red-500 mt-1">{similarError}</p>}

            {similarTasks.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {similarTasks.map((st) => (
                  <div
                    key={st.task_id}
                    className="p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      const found = dispatch as any
                      // Navigate to similar task if it exists in current list
                      const taskEl = document.querySelector(`[data-task-id="${st.task_id}"]`)
                      if (taskEl) taskEl.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    <p className="text-sm font-medium text-blue-800">{st.title}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{st.similarity_reason}</p>
                  </div>
                ))}
              </div>
            )}

            {!similarLoading && similarTasks.length === 0 && similarError === '' && similarTasks !== undefined && similarLoading === false && (
              <p className="text-xs text-gray-400 mt-1">点击按钮检测与当前任务相似的其他任务</p>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>创建时间: {formatDate(task.created_at)}</p>
            <p>更新时间: {formatDate(task.updated_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-t bg-gray-50">
          {task.status !== 'completed' && (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Check size={16} />完成
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit3 size={16} />编辑
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            <Trash2 size={16} />删除
          </button>
        </div>
      </div>
    </div>
  )
}
