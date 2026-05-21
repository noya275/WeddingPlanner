import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Task, TaskStatus } from '../api/types'

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'todo', label: 'To Do', dot: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', dot: 'bg-blue-400' },
  { status: 'done', label: 'Done', dot: 'bg-green-400' },
]

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

function AddTaskRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  function submit() {
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
  }

  return (
    <div className="pt-2 border-t border-dashed border-gray-200 mt-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
        onBlur={submit}
        placeholder="+ Add task..."
        className="w-full text-sm outline-none bg-transparent text-gray-700 guest-add-input px-1 py-1"
      />
    </div>
  )
}

export default function Tasks() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', eventId],
    queryFn: () => api.get(`/events/${eventId}/tasks`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const createTask = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/tasks`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: { id: number; title?: string; status?: TaskStatus; assigned_to?: string | null; due_date?: string | null; category?: string | null }) =>
      api.patch(`/events/${eventId}/tasks/${id}`, data).then((r) => r.data),
    onSuccess: (updated: Task) => {
      queryClient.setQueryData(['tasks', eventId], (old: Task[] = []) =>
        old.map((t) => (t.id === updated.id ? updated : t))
      )
    },
  })

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', eventId] }),
  })

  function moveTask(task: Task, direction: -1 | 1) {
    const idx = STATUS_ORDER.indexOf(task.status)
    const next = STATUS_ORDER[idx + direction]
    if (next) updateTask.mutate({ id: task.id, status: next })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(({ status, label, dot }, colIdx) => {
            const columnTasks = tasks.filter((t) => t.status === status)
            return (
              <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <span className="text-base font-bold text-gray-700">{label}</span>
                  <span className="text-base font-bold text-gray-400 ml-auto">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <textarea
                          key={task.id}
                          defaultValue={task.title}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== task.title) updateTask.mutate({ id: task.id, title: v }) }}
                          rows={3}
                          className="flex-1 resize-none bg-transparent outline-none font-medium text-gray-900 placeholder-gray-300 w-full"
                        />
                        <button
                          onClick={() => deleteTask.mutate(task.id)}
                          className="hover:text-red-500 text-base shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                          style={{ color: '#7a6a60' }}
                        >
                          ×
                        </button>
                      </div>
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
                  <AddTaskRow onAdd={(title) => createTask.mutate({ title, status })} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
