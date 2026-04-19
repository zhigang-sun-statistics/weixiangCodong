import { useState } from 'react'
import { Plus, LayoutList, Columns3, Calendar, Settings } from 'lucide-react'
import { useTaskContext } from '../../context/TaskContext'
import { SearchBar } from '../filters/SearchBar'
import { AISettingsModal } from '../ai/AISettingsModal'

export function Header() {
  const { state, dispatch } = useTaskContext()
  const [showAISettings, setShowAISettings] = useState(false)

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">任务管理</h1>

        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className={`p-2 transition-colors ${
                state.viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
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
                  : 'text-gray-500 hover:bg-gray-50'
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
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              title="日历视图"
            >
              <Calendar size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowAISettings(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="AI 设置"
          >
            <Settings size={18} />
          </button>

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
