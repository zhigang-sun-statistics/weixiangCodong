import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTaskContext } from '../../context/TaskContext'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/constants'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981']

export function TaskStats() {
  const { state } = useTaskContext()

  if (state.tasks.length === 0) return null

  // Status distribution
  const statusData = (['pending', 'in_progress', 'completed'] as const).map((s, i) => ({
    name: STATUS_CONFIG[s].label,
    value: state.tasks.filter((t) => t.status === s).length,
    color: COLORS[i],
  })).filter((d) => d.value > 0)

  // Priority distribution
  const priorityData = (['high', 'medium', 'low'] as const).map((p) => ({
    name: PRIORITY_CONFIG[p].label,
    value: state.tasks.filter((t) => t.priority === p).length,
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        统计
      </h3>

      {/* Status pie chart */}
      {statusData.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">状态分布</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={3}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: any) => [`${value} 个`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1">
            {statusData.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} {d.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority bar chart */}
      {priorityData.some((d) => d.value > 0) && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">优先级分布</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={priorityData} layout="vertical" margin={{ left: 20, right: 10 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={20} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
