import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { parseNaturalLanguage } from '../../api/ai'
import { useTaskContext } from '../../context/TaskContext'
import type { NLTaskParseResult } from '../../types'

export function NLTaskCreator() {
  const { dispatch } = useTaskContext()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const result: NLTaskParseResult = await parseNaturalLanguage(text.trim())
      setText('')
      dispatch({ type: 'SET_AI_PARSED_TASK', payload: result })
      dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: true })
    } catch (err: any) {
      setError(err.message || 'AI 解析失败，请检查 AI 设置')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Sparkles size={14} className="text-purple-500" />
        AI 智能创建
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
        rows={2}
        placeholder="如：明天下午3点提醒我买菜"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleParse()
          }
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleParse}
        disabled={loading || !text.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? '解析中...' : 'AI 解析并创建'}
      </button>
    </div>
  )
}
