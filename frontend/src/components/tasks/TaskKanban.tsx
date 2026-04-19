import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useTaskContext } from '../../context/TaskContext'
import { TaskCard } from './TaskCard'
import { updateTaskStatus } from '../../api/tasks'
import { STATUS_CONFIG } from '../../utils/constants'
import type { TaskStatus } from '../../types'
import { LoadingSpinner } from '../common/LoadingSpinner'

const columns: TaskStatus[] = ['pending', 'in_progress', 'completed']

export function TaskKanban() {
  const { state, dispatch } = useTaskContext()

  if (state.loading && state.tasks.length === 0) return <LoadingSpinner />

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const taskId = parseInt(result.draggableId)
    const newStatus = result.destination.droppableId as TaskStatus

    const task = state.tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    try {
      const updated = await updateTaskStatus(taskId, newStatus)
      dispatch({ type: 'UPDATE_TASK', payload: updated })
    } catch {}
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const tasks = state.tasks.filter((t) => t.status === status)

          return (
            <div key={status} className="flex flex-col bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <h3 className="font-semibold text-sm text-gray-700">{cfg.label}</h3>
                <span className="text-xs text-gray-400 ml-auto">{tasks.length}</span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[200px] rounded-b-xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
