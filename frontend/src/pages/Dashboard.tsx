import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Event } from '../api/types'

interface EventFormValues {
  title: string
}

function EventForm({
  initialValues,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initialValues: EventFormValues
  onSubmit: (values: EventFormValues) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
}) {
  const [title, setTitle] = useState(initialValues.title)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ title }) }}
      className="bg-white border border-burgundy-200 rounded-2xl p-6 space-y-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Event name"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-burgundy-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-burgundy-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
        >
          {isPending ? `${submitLabel}...` : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events/').then((r) => r.data),
    refetchInterval: 5000,
  })

  const createEvent = useMutation({
    mutationFn: (values: EventFormValues) =>
      api.post('/events/', { title: values.title }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowForm(false)
    },
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, values }: { id: number; values: EventFormValues }) =>
      api.patch(`/events/${id}`, { title: values.title }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditingId(null)
    },
  })

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 transition-colors"
        >
          + New Event
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <EventForm
            initialValues={{ title: '' }}
            onSubmit={(values) => createEvent.mutate(values)}
            onCancel={() => setShowForm(false)}
            isPending={createEvent.isPending}
            submitLabel="Create"
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No events yet.</p>
          <p className="text-sm mt-1">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) =>
            editingId === event.id ? (
              <EventForm
                key={event.id}
                initialValues={{ title: event.title }}
                onSubmit={(values) => updateEvent.mutate({ id: event.id, values })}
                onCancel={() => setEditingId(null)}
                isPending={updateEvent.isPending}
                submitLabel="Save"
              />
            ) : (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <Link to={`/events/${event.id}/guests`} className="flex-1 min-w-0 mr-4">
                    <h2 className="font-bold text-gray-900 text-2xl leading-tight hover:text-burgundy-700 transition-colors">
                      {event.title}
                    </h2>
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(event.id)}
                      style={{ color: '#7a6a60' }}
                      className="hover:text-burgundy-600 text-2xl px-2 py-1 transition-colors"
                      title="Edit event"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete "${event.title}"? This cannot be undone.`)) deleteEvent.mutate(event.id) }}
                      style={{ color: '#7a6a60' }}
                      className="hover:text-red-500 text-2xl leading-none px-1 transition-colors"
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
