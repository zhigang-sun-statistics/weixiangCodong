import { useTaskContext } from '../../context/TaskContext'
import { StatusFilter } from '../filters/StatusFilter'
import { PriorityFilter } from '../filters/PriorityFilter'
import { NLTaskCreator } from '../ai/NLTaskCreator'
import { TaskSummary } from '../ai/TaskSummary'
import { TaskStats } from '../tasks/TaskStats'

export function Sidebar() {
  const { state, dispatch } = useTaskContext()

  const allTags = Array.from(new Set(state.tasks.flatMap((t) => t.tags)))

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto shrink-0 hidden md:block">
      <div className="space-y-6">
        <NLTaskCreator />

        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">状态</h3>
          <StatusFilter
            value={state.filters.status}
            onChange={(status) => dispatch({ type: 'SET_FILTERS', payload: { status } })}
          />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">优先级</h3>
          <PriorityFilter
            value={state.filters.priority}
            onChange={(priority) => dispatch({ type: 'SET_FILTERS', payload: { priority } })}
          />
        </div>

        {allTags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">标签</h3>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => dispatch({ type: 'SET_FILTERS', payload: { tags: '' } })}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  state.filters.tags === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => dispatch({ type: 'SET_FILTERS', payload: { tags: tag } })}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    state.filters.tags === tag
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <TaskSummary />

        <TaskStats />
      </div>
    </aside>
  )
}
