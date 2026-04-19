import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { summarizeTasks } from '../../api/ai'

export function TaskSummary() {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSummarize() {
    setLoading(true)
    setError('')
    try {
      const result = await summarizeTasks()
      setSummary(result)
    } catch (err: any) {
      setError(err.message || '摘要生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {loading ? '生成中...' : 'AI 任务摘要'}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {summary && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
          {summary}
        </div>
      )}
    </div>
  )
}
