import { useEffect, useState, useCallback } from 'react'
import { TaskProvider, useTaskContext } from './context/TaskContext'
import { fetchTasks } from './api/tasks'
import { getToken } from './api/auth'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './components/auth/LoginPage'
import { TaskList } from './components/tasks/TaskList'
import { TaskKanban } from './components/tasks/TaskKanban'
import { TaskCalendar } from './components/tasks/TaskCalendar'
import { TaskForm } from './components/tasks/TaskForm'
import { TaskDetail } from './components/tasks/TaskDetail'
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

    // Esc — close modals / deselect
    if (e.key === 'Escape') {
      if (state.showCreateModal) {
        dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: false })
        return
      }
      if (state.selectedTask) {
        dispatch({ type: 'SELECT_TASK', payload: null })
        return
      }
      return
    }

    // Skip shortcuts when typing in inputs
    if (isInput) return

    // N — new task
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault()
      dispatch({ type: 'TOGGLE_CREATE_MODAL' })
      return
    }

    // Ctrl+K — focus search
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault()
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder="搜索任务..."]')
      if (searchInput) searchInput.focus()
      return
    }

    // 1/2/3 — switch view
    if (e.key === '1') {
      e.preventDefault()
      dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })
    } else if (e.key === '2') {
      e.preventDefault()
      dispatch({ type: 'SET_VIEW_MODE', payload: 'kanban' })
    } else if (e.key === '3') {
      e.preventDefault()
      dispatch({ type: 'SET_VIEW_MODE', payload: 'calendar' })
    }
  }, [state.showCreateModal, state.selectedTask, dispatch])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const viewComponent: Record<ViewMode, React.ReactNode> = {
    list: <TaskList />,
    kanban: <TaskKanban />,
    calendar: <TaskCalendar />,
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
  const [loggedIn, setLoggedIn] = useState(() => !!getToken())

  if (!loggedIn) {
    return (
      <LoginPage onSuccess={() => setLoggedIn(true)} />
    )
  }

  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  )
}
