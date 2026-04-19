import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskContext } from '../../context/TaskContext'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/constants'
import { TaskCard } from './TaskCard'
import type { Task } from '../../types'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function TaskCalendar() {
  const { state, dispatch } = useTaskContext()
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [month, setMonth] = React.useState(new Date().getMonth())

  const calendar = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Monday=0, Sunday=6
    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const tasksByDate = new Map<string, Task[]>()
    const noDateTasks: Task[] = []

    for (const task of state.tasks) {
      if (task.due_date) {
        const d = new Date(task.due_date)
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (!tasksByDate.has(key)) tasksByDate.set(key, [])
        tasksByDate.get(key)!.push(task)
      } else {
        noDateTasks.push(task)
      }
    }

    const cells: { date: number | null; tasks: Task[] }[] = []

    // Empty cells before month start
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, tasks: [] })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`
      cells.push({ date: d, tasks: tasksByDate.get(key) || [] })
    }

    return { cells, noDateTasks }
  }, [state.tasks, year, month])

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11) } else { setMonth(month - 1) }
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0) } else { setMonth(month + 1) }
  }

  function goToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{year}年 {month + 1}月</h2>
          <button onClick={goToday} className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">
            今天
          </button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border border-gray-200 rounded-xl overflow-hidden">
        {/* Weekday headers */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {calendar.cells.map((cell, i) => (
          <div
            key={i}
            className={`min-h-[100px] p-1.5 border-b border-r border-gray-100 ${
              cell.date === null ? 'bg-gray-50/50' : 'bg-white'
            }`}
          >
            {cell.date !== null && (
              <>
                <div className="text-xs text-gray-500 mb-1">{cell.date}</div>
                <div className="space-y-1">
                  {cell.tasks.slice(0, 3).map((task) => {
                    const sCfg = STATUS_CONFIG[task.status]
                    const pCfg = PRIORITY_CONFIG[task.priority]
                    return (
                      <div
                        key={task.id}
                        onClick={() => dispatch({ type: 'SELECT_TASK', payload: task })}
                        className="cursor-pointer text-xs px-1.5 py-1 rounded truncate hover:shadow-sm transition-shadow border-l-2"
                        style={{ borderLeftColor: pCfg.badge.includes('red') ? '#ef4444' : pCfg.badge.includes('yellow') ? '#eab308' : '#9ca3af' }}
                        title={task.title}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sCfg.dot}`} />
                        {task.title}
                      </div>
                    )
                  })}
                  {cell.tasks.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1.5">+{cell.tasks.length - 3} 更多</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Tasks without due date */}
      {calendar.noDateTasks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">未设置截止日期</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {calendar.noDateTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
