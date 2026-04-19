import React, { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Task, Filters, ViewMode, NLTaskParseResult } from '../types'

interface State {
  tasks: Task[]
  filters: Filters
  viewMode: ViewMode
  loading: boolean
  error: string | null
  page: number
  total: number
  totalPages: number
  selectedTask: Task | null
  showCreateModal: boolean
  aiParsedTask: NLTaskParseResult | null
}

type Action =
  | { type: 'SET_TASKS'; payload: { items: Task[]; total: number; totalPages: number; page: number } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'SET_FILTERS'; payload: Partial<Filters> }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SELECT_TASK'; payload: Task | null }
  | { type: 'TOGGLE_CREATE_MODAL'; payload?: boolean }
  | { type: 'SET_AI_PARSED_TASK'; payload: NLTaskParseResult | null }

const initialState: State = {
  tasks: [],
  filters: { status: '', priority: '', tags: '', search: '' },
  viewMode: 'kanban',
  loading: false,
  error: null,
  page: 1,
  total: 0,
  totalPages: 0,
  selectedTask: null,
  showCreateModal: false,
  aiParsedTask: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload.items,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
        page: action.payload.page,
        loading: false,
      }
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks], total: state.total + 1 }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
        selectedTask: state.selectedTask?.id === action.payload.id ? action.payload : state.selectedTask,
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
        total: state.total - 1,
        selectedTask: state.selectedTask?.id === action.payload ? null : state.selectedTask,
      }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload }, page: 1 }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_PAGE':
      return { ...state, page: action.payload }
    case 'SELECT_TASK':
      return { ...state, selectedTask: action.payload }
    case 'TOGGLE_CREATE_MODAL':
      return { ...state, showCreateModal: action.payload ?? !state.showCreateModal }
    case 'SET_AI_PARSED_TASK':
      return { ...state, aiParsedTask: action.payload }
    default:
      return state
  }
}

const TaskContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <TaskContext.Provider value={{ state, dispatch }}>{children}</TaskContext.Provider>
}

export function useTaskContext() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider')
  return ctx
}

export type { Action }
