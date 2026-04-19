import { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2, ImagePlus, X } from 'lucide-react'
import { parseNaturalLanguage, parseImage } from '../../api/ai'
import { useTaskContext } from '../../context/TaskContext'
import type { NLTaskParseResult } from '../../types'

export function NLTaskCreator() {
  const { dispatch } = useTaskContext()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paste support (Ctrl+V)
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFileSelect(file)
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  function handleFileSelect(file: File | FileList) {
    const f = file instanceof FileList ? file[0] : file
    if (!f || !f.type.startsWith('image/')) return
    setImageFile(f)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(f))
    setError('')
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  async function handleParse() {
    if (!text.trim() && !imageFile) return
    setLoading(true)
    setError('')
    try {
      let result: NLTaskParseResult
      if (imageFile) {
        result = await parseImage(imageFile)
      } else {
        result = await parseNaturalLanguage(text.trim())
      }
      setText('')
      clearImage()
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Sparkles size={14} className="text-purple-500" />
        AI 智能创建
      </label>

      {/* Drop zone wrapping textarea */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 transition-colors ${
          isDragging
            ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
            : 'border-transparent'
        }`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          rows={2}
          placeholder="如：明天下午3点提醒我买菜"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleParse()
            }
          }}
        />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="预览"
            className="h-20 rounded-lg border border-gray-200 dark:border-gray-600 object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Helper row: upload button + hint */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFileSelect(e.target.files)
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="上传图片"
        >
          <ImagePlus size={16} />
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          支持 Ctrl+V 粘贴截图或拖拽图片
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleParse}
        disabled={loading || (!text.trim() && !imageFile)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? '解析中...' : 'AI 解析并创建'}
      </button>
    </div>
  )
}
