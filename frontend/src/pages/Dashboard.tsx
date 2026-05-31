import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Event } from '../api/types'

interface EventFormValues {
  title: string
  date: string
}

/** Controlled form used for both creating a new event and editing an existing one's title and date. */
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
  const [date, setDate] = useState(initialValues.date)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ title, date }) }}
      className="bg-white border border-burgundy-200 rounded-2xl p-6 space-y-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoComplete="off"
        placeholder="Event name"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-burgundy-500"
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
        {date && (
          <button type="button" onClick={() => setDate('')} className="text-gray-400 hover:text-gray-600 text-sm">
            Clear
          </button>
        )}
        {!date && <span className="text-xs text-gray-400 shrink-0">optional</span>}
      </div>
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

/** Main landing page: lists all events with optimistic create, rename, and delete actions. */
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
      api.post('/events/', { title: values.title, date: values.date || null }).then((r) => r.data),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previous = queryClient.getQueryData<Event[]>(['events'])
      const tempEvent: Event = {
        id: -Date.now(),
        title: values.title,
        date: values.date || null,
        budget_total: null,
        table_count: 8,
        table_capacity: 10,
        done_tables: [],
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData(['events'], (old: Event[] = []) => [...old, tempEvent])
      setShowForm(false)
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(['events'], context.previous)
      setShowForm(true)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, values }: { id: number; values: EventFormValues }) =>
      api.patch(`/events/${id}`, { title: values.title, date: values.date || null }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditingId(null)
    },
  })

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previous = queryClient.getQueryData<Event[]>(['events'])
      queryClient.setQueryData(['events'], (old: Event[] = []) => old.filter((e) => e.id !== id))
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(['events'], context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
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
            initialValues={{ title: '', date: '' }}
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
                initialValues={{ title: event.title, date: event.date ?? '' }}
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
                  {event.id > 0 ? (
                    <Link to={`/events/${event.id}/guests`} className="flex-1 min-w-0 mr-4">
                      <h2 className="font-bold text-gray-900 text-2xl leading-tight hover:text-burgundy-700 transition-colors">
                        {event.title}
                      </h2>
                      {event.date && (
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </Link>
                  ) : (
                    <div className="flex-1 min-w-0 mr-4">
                      <h2 className="font-bold text-gray-400 text-2xl leading-tight">{event.title}</h2>
                    </div>
                  )}
                  {event.id > 0 && (
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
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
