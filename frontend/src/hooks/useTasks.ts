import { useCallback } from 'react'
import { useTaskContext } from '../context/TaskContext'
import * as taskApi from '../api/tasks'
import type { TaskCreateData, TaskUpdateData } from '../types'

export function useTasks() {
  const { state, dispatch } = useTaskContext()

  const loadTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const params: Record<string, string | number> = {
        page: state.page,
        page_size: 10,
        sort_by: 'created_at',
        sort_order: 'desc',
      }
      if (state.filters.status) params.status = state.filters.status
      if (state.filters.priority) params.priority = state.filters.priority
      if (state.filters.tags) params.tags = state.filters.tags
      if (state.filters.search) params.search = state.filters.search

      const data = await taskApi.fetchTasks(params)
      dispatch({
        type: 'SET_TASKS',
        payload: { items: data.items, total: data.total, totalPages: data.total_pages, page: data.page },
      })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message })
    }
  }, [state.page, state.filters, dispatch])

  const createTask = useCallback(
    async (data: TaskCreateData) => {
      const task = await taskApi.createTask(data)
      dispatch({ type: 'ADD_TASK', payload: task })
      return task
    },
    [dispatch]
  )

  const updateTask = useCallback(
    async (id: number, data: TaskUpdateData) => {
      const task = await taskApi.updateTask(id, data)
      dispatch({ type: 'UPDATE_TASK', payload: task })
      return task
    },
    [dispatch]
  )

  const deleteTask = useCallback(
    async (id: number) => {
      await taskApi.deleteTask(id)
      dispatch({ type: 'DELETE_TASK', payload: id })
    },
    [dispatch]
  )

  const changeStatus = useCallback(
    async (id: number, status: string) => {
      const task = await taskApi.updateTaskStatus(id, status)
      dispatch({ type: 'UPDATE_TASK', payload: task })
      return task
    },
    [dispatch]
  )

  return { ...state, loadTasks, createTask, updateTask, deleteTask, changeStatus }
}
