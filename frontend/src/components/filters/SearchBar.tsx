import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useTaskContext } from '../../context/TaskContext'

export function SearchBar() {
  const { state, dispatch } = useTaskContext()
  const [value, setValue] = useState(state.filters.search)

  useEffect(() => {
    setValue(state.filters.search)
  }, [state.filters.search])

  const updateSearch = useCallback(
    (val: string) => {
      dispatch({ type: 'SET_FILTERS', payload: { search: val } })
    },
    [dispatch]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== state.filters.search) {
        updateSearch(value)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索任务..."
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
      />
      {value && (
        <button
          onClick={() => {
            setValue('')
            updateSearch('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
