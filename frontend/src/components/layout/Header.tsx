import { useState } from 'react'
import { Plus, LayoutList, Columns3, Calendar, Settings, Sun, Moon, Download } from 'lucide-react'
import { useTaskContext } from '../../context/TaskContext'
import { useTheme } from '../../hooks/useTheme'
import { SearchBar } from '../filters/SearchBar'
import { AISettingsModal } from '../ai/AISettingsModal'
import { getExportUrl } from '../../api/tasks'

export function Header() {
  const { state, dispatch } = useTaskContext()
  const { theme, toggleTheme } = useTheme()
  const [showAISettings, setShowAISettings] = useState(false)
  const [showExport, setShowExport] = useState(false)

  function handleExport(format: 'csv' | 'json') {
    const filters: Record<string, string> = {}
    if (state.filters.status) filters.status = state.filters.status
    if (state.filters.priority) filters.priority = state.filters.priority
    if (state.filters.tags) filters.tags = state.filters.tags
    if (state.filters.search) filters.search = state.filters.search
    window.open(getExportUrl(format, filters), '_blank')
    setShowExport(false)
  }

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 gap-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">任务管理</h1>

        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className={`p-2 transition-colors ${
                state.viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="列表视图"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'kanban' })}
              className={`p-2 transition-colors ${
                state.viewMode === 'kanban'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="看板视图"
            >
              <Columns3 size={18} />
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'calendar' })}
              className={`p-2 transition-colors ${
                state.viewMode === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="日历视图"
            >
              <Calendar size={18} />
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setShowAISettings(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="AI 设置"
          >
            <Settings size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="导出任务"
            >
              <Download size={18} />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  导出为 CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  导出为 JSON
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_CREATE_MODAL' })}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新建任务</span>
          </button>
        </div>
      </header>

      <AISettingsModal isOpen={showAISettings} onClose={() => setShowAISettings(false)} />
    </>
  )
}
