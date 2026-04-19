import { useTaskContext } from '../../context/TaskContext'
import { TaskCard } from './TaskCard'
import { Pagination } from '../common/Pagination'
import { LoadingSpinner } from '../common/LoadingSpinner'

export function TaskList() {
  const { state, dispatch } = useTaskContext()

  if (state.loading && state.tasks.length === 0) return <LoadingSpinner />
  if (state.tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <p className="text-lg">暂无任务</p>
        <p className="text-sm mt-1">点击「新建任务」开始</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-2">
        {state.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      {state.totalPages > 1 && (
        <Pagination
          page={state.page}
          totalPages={state.totalPages}
          onPageChange={(p) => dispatch({ type: 'SET_PAGE', payload: p })}
        />
      )}
    </div>
  )
}
