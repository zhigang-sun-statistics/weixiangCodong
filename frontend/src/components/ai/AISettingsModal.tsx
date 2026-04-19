import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { getAISettings, updateAISettings } from '../../api/ai'

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOpen) loadSettings()
  }, [isOpen])

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await getAISettings()
      setProvider(data.provider)
      setPreview(data.api_key_preview)
      setApiKey('')
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      setMessage('请输入 API Key')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const data = await updateAISettings(provider, apiKey.trim())
      setPreview(data.api_key_preview)
      setApiKey('')
      setMessage('保存成功')
    } catch (err: any) {
      setMessage(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI 设置">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AI 提供商</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="openai">OpenAI (GPT)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          {preview && (
            <p className="text-xs text-gray-400 mb-1">当前: {preview}</p>
          )}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="输入新的 API Key"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            关闭
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
