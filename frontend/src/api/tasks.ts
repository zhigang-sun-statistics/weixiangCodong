import api from './client'
import type { Task, TaskListResponse, TaskCreateData, TaskUpdateData } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

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

export function getExportUrl(format: 'csv' | 'json', filters?: Record<string, string>): string {
  const base = `${API_BASE}/api/tasks/export/all?format=${format}`
  if (!filters) return base
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${base}&${qs}` : base
}
