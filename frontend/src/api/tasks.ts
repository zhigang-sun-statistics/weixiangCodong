import api from './client'
import type { Task, TaskListResponse, TaskCreateData, TaskUpdateData } from '../types'

export async function fetchTasks(params: Record<string, string | number>): Promise<TaskListResponse> {
  const res = await api.get('/tasks', { params })
  return res.data
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await api.get(`/tasks/${id}`)
  return res.data
}

export async function createTask(data: TaskCreateData): Promise<Task> {
  const res = await api.post('/tasks', data)
  return res.data
}

export async function updateTask(id: number, data: TaskUpdateData): Promise<Task> {
  const res = await api.put(`/tasks/${id}`, data)
  return res.data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

export async function updateTaskStatus(id: number, status: string): Promise<Task> {
  const res = await api.patch(`/tasks/${id}/status`, { status })
  return res.data
}
