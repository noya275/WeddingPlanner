import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Task, TaskStatus } from '../api/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-600' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-600' },
  { status: 'done', label: 'Done', color: 'bg-green-100 text-green-600' },
]

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
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700"
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
                Task <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Book photographer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to</label>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Photography"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createTask.isPending}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
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
          {COLUMNS.map(({ status, label, color }) => {
            const columnTasks = tasks.filter((t) => t.status === status)
            return (
              <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <button
                          onClick={() => deleteTask.mutate(task.id)}
                          className="text-gray-200 hover:text-red-500 text-base ml-1"
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
                      <div className="mt-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })
                          }
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 w-full"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
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
