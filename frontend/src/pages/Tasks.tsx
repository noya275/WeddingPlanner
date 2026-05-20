import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Task, TaskStatus } from '../api/types'

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'todo', label: 'To Do', dot: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', dot: 'bg-blue-400' },
  { status: 'done', label: 'Done', dot: 'bg-green-400' },
]

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

export default function Tasks() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', eventId],
    queryFn: () => api.get(`/events/${eventId}/tasks`).then((r) => r.data),
  })

  const createTask = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/tasks`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', eventId] })
      setShowForm(false)
      setTitle('')
      setAssignedTo('')
      setDueDate('')
      setCategory('')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      api.patch(`/events/${eventId}/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
  })

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
  })

  function moveTask(task: Task, direction: -1 | 1) {
    const idx = STATUS_ORDER.indexOf(task.status)
    const next = STATUS_ORDER[idx + direction]
    if (next) updateStatus.mutate({ id: task.id, status: next })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createTask.mutate({
              title,
              assigned_to: assignedTo || null,
              due_date: dueDate || null,
              category: category || null,
            })
          }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task <span className="text-burgundy-600">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Book photographer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to</label>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Photography"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createTask.isPending}
              className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(({ status, label, dot }, colIdx) => {
            const columnTasks = tasks.filter((t) => t.status === status)
            return (
              <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 flex-1 mr-1">{task.title}</p>
                        <button
                          onClick={() => deleteTask.mutate(task.id)}
                          className="text-gray-200 hover:text-red-500 text-base shrink-0"
                        >
                          ×
                        </button>
                      </div>
                      {task.assigned_to && (
                        <p className="text-xs text-gray-400 mt-1">{task.assigned_to}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-gray-400">
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                      {task.category && (
                        <p className="text-xs text-gray-300 mt-0.5">{task.category}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {colIdx > 0 && (
                          <button
                            onClick={() => moveTask(task, -1)}
                            className="text-xs text-gray-400 hover:text-burgundy-700 px-1.5 py-0.5 rounded border border-gray-200 hover:border-burgundy-300 transition-colors"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}
                        {colIdx < COLUMNS.length - 1 && (
                          <button
                            onClick={() => moveTask(task, 1)}
                            className="text-xs text-gray-400 hover:text-burgundy-700 px-1.5 py-0.5 rounded border border-gray-200 hover:border-burgundy-300 transition-colors"
                            title="Move right"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="text-xs text-gray-300 text-center py-4">Empty</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
