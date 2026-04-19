import api from './client'
import type { NLTaskParseResult, SubTaskItem, AISettingsData } from '../types'

export async function parseNaturalLanguage(text: string): Promise<NLTaskParseResult> {
  const res = await api.post('/ai/parse-task', { text })
  return res.data
}

export async function suggestTags(title: string, description?: string): Promise<string[]> {
  const res = await api.post('/ai/suggest-tags', { title, description })
  return res.data.tags
}

export async function recommendPriority(title: string, description?: string): Promise<{ priority: string; reason: string }> {
  const res = await api.post('/ai/recommend-priority', { title, description })
  return res.data
}

export async function breakdownTask(title: string, description?: string): Promise<SubTaskItem[]> {
  const res = await api.post('/ai/breakdown-task', { title, description })
  return res.data.subtasks
}

export async function summarizeTasks(taskIds?: number[]): Promise<string> {
  const res = await api.post('/ai/summarize-tasks', { task_ids: taskIds })
  return res.data.summary
}

export async function detectSimilar(taskId: number): Promise<{ task_id: number; title: string; similarity_reason: string }[]> {
  const res = await api.post('/ai/detect-similar', { task_id: taskId })
  return res.data.similar_tasks
}

export async function getAISettings(): Promise<AISettingsData> {
  const res = await api.get('/ai/settings')
  return res.data
}

export async function updateAISettings(provider: string, apiKey: string): Promise<AISettingsData> {
  const res = await api.put('/ai/settings', { provider, api_key: apiKey })
  return res.data
}
