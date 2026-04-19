export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskListResponse {
  items: Task[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TaskCreateData {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  tags?: string[]
  due_date?: string | null
}

export interface TaskUpdateData {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  tags?: string[]
  due_date?: string | null
}

export interface Filters {
  status: TaskStatus | ''
  priority: TaskPriority | ''
  tags: string
  search: string
}

export type ViewMode = 'list' | 'kanban' | 'calendar'

export interface NLTaskParseResult {
  title: string
  description?: string | null
  priority?: string | null
  tags?: string[] | null
  due_date?: string | null
  method?: 'local' | 'llm'
}

export interface SubTaskItem {
  title: string
  description?: string | null
}

export interface AISettingsData {
  provider: string
  api_key_set: boolean
  api_key_preview: string | null
}
