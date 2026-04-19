import { useEffect } from 'react'
import { TaskProvider, useTaskContext } from './context/TaskContext'
import { fetchTasks } from './api/tasks'
import { Layout } from './components/layout/Layout'
import { TaskList } from './components/tasks/TaskList'
import { TaskKanban } from './components/tasks/TaskKanban'
import { TaskForm } from './components/tasks/TaskForm'
import { TaskDetail } from './components/tasks/TaskDetail'
import { ConfirmDialog } from './components/common/ConfirmDialog'
import { ITEMS_PER_PAGE } from './utils/constants'
import type { ViewMode } from './types'

function AppContent() {
  const { state, dispatch } = useTaskContext()

  useEffect(() => {
    loadTasks()
  }, [state.filters, state.page, state.viewMode])

  async function loadTasks() {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const params: Record<string, string | number> = {
        page: state.page,
        page_size: ITEMS_PER_PAGE,
      }
      if (state.filters.status) params.status = state.filters.status
      if (state.filters.priority) params.priority = state.filters.priority
      if (state.filters.tags) params.tags = state.filters.tags
      if (state.filters.search) params.search = state.filters.search

      const res = await fetchTasks(params)
      dispatch({
        type: 'SET_TASKS',
        payload: {
          items: res.items,
          total: res.total,
          totalPages: res.total_pages,
          page: res.page,
        },
      })
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || '加载任务失败' })
    }
  }

  const viewComponent: Record<ViewMode, React.ReactNode> = {
    list: <TaskList />,
    kanban: <TaskKanban />,
  }

  return (
    <Layout>
      {viewComponent[state.viewMode]}
      {state.showCreateModal && <TaskForm onClose={() => dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: false })} />}
      {state.selectedTask && <TaskDetail task={state.selectedTask} onClose={() => dispatch({ type: 'SELECT_TASK', payload: null })} />}
    </Layout>
  )
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  )
}
