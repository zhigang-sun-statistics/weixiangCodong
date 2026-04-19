import { useState, useEffect } from 'react'
import { Sparkles, Loader2, X } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useTaskContext } from '../../context/TaskContext'
import { createTask, updateTask } from '../../api/tasks'
import { suggestTags, recommendPriority } from '../../api/ai'
import type { Task, TaskStatus, TaskPriority, TaskCreateData } from '../../types'

interface TaskFormProps {
  onClose: () => void
  editTask?: Task | null
}

export function TaskForm({ onClose, editTask }: TaskFormProps) {
  const { state, dispatch } = useTaskContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(editTask?.title || '')
  const [description, setDescription] = useState(editTask?.description || '')
  const [status, setStatus] = useState<TaskStatus>(editTask?.status || 'pending')
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'medium')
  const [tagsInput, setTagsInput] = useState(editTask?.tags?.join(', ') || '')
  const [dueDate, setDueDate] = useState(editTask?.due_date?.slice(0, 16) || '')

  // AI feature states
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [recommendedPriority, setRecommendedPriority] = useState<{ priority: string; reason: string } | null>(null)
  const [priorityLoading, setPriorityLoading] = useState(false)

  // TODO-01: consume aiParsedTask from context
  useEffect(() => {
    if (state.aiParsedTask && !editTask) {
      const p = state.aiParsedTask
      if (p.title) setTitle(p.title)
      if (p.description) setDescription(p.description)
      if (p.priority && ['low', 'medium', 'high'].includes(p.priority)) {
        setPriority(p.priority as TaskPriority)
      }
      if (p.tags && p.tags.length > 0) setTagsInput(p.tags.join(', '))
      if (p.due_date) {
        try {
          const d = new Date(p.due_date)
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0')
            setDueDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
          }
        } catch {}
      }
      dispatch({ type: 'SET_AI_PARSED_TASK', payload: null })
    }
  }, [state.aiParsedTask, editTask, dispatch])

  // TODO-03: AI tag suggestion
  async function handleSuggestTags() {
    if (!title.trim()) return
    setTagsLoading(true)
    try {
      const tags = await suggestTags(title, description || undefined)
      setSuggestedTags(tags)
    } catch {
      setSuggestedTags([])
    } finally {
      setTagsLoading(false)
    }
  }

  function addTag(tag: string) {
    const current = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    if (!current.includes(tag)) {
      const newTags = [...current, tag].join(', ')
      setTagsInput(newTags)
    }
    setSuggestedTags((prev) => prev.filter((t) => t !== tag))
  }

  // TODO-04: AI priority recommendation
  async function handleRecommendPriority() {
    if (!title.trim()) return
    setPriorityLoading(true)
    try {
      const result = await recommendPriority(title, description || undefined)
      setRecommendedPriority(result)
    } catch {
      setRecommendedPriority(null)
    } finally {
      setPriorityLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('标题不能为空')
      return
    }
    setLoading(true)
    setError('')

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const data: TaskCreateData = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      tags: tags.length > 0 ? tags : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }

    try {
      if (editTask) {
        const updated = await updateTask(editTask.id, data)
        dispatch({ type: 'UPDATE_TASK', payload: updated })
      } else {
        const created = await createTask(data)
        dispatch({ type: 'ADD_TASK', payload: created })
      }
      onClose()
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={editTask ? '编辑任务' : '新建任务'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="输入任务标题"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={3}
            placeholder="可选的任务描述"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="pending">待办</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">优先级</label>
              <button
                type="button"
                onClick={handleRecommendPriority}
                disabled={priorityLoading || !title.trim()}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-40"
                title="AI 推荐优先级"
              >
                {priorityLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI推荐
              </button>
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
            {recommendedPriority && (
              <div className="mt-1 p-2 bg-purple-50 rounded-lg text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700">
                    推荐: <strong>{recommendedPriority.priority === 'high' ? '高' : recommendedPriority.priority === 'medium' ? '中' : '低'}</strong>
                    {' — '}{recommendedPriority.reason}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(recommendedPriority.priority as TaskPriority)
                      setRecommendedPriority(null)
                    }}
                    className="text-purple-600 hover:text-purple-800 font-medium ml-2 whitespace-nowrap"
                  >
                    采纳
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">标签</label>
            <button
              type="button"
              onClick={handleSuggestTags}
              disabled={tagsLoading || !title.trim()}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-40"
              title="AI 推荐标签"
            >
              {tagsLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI推荐
            </button>
          </div>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="用逗号分隔，如：工作, 紧急"
          />
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                >
                  <Sparkles size={10} />{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">截止时间</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '提交中...' : editTask ? '保存' : '创建'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
