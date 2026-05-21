import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Event } from '../api/types'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editVenue, setEditVenue] = useState('')

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events/').then((r) => r.data),
    refetchInterval: 5000,
  })

  const createEvent = useMutation({
    mutationFn: (payload: { title: string; date?: string; venue?: string }) =>
      api.post('/events/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowForm(false)
      setTitle('')
      setDate('')
      setVenue('')
    },
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; title: string; date?: string; venue?: string }) =>
      api.patch(`/events/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditingId(null)
    },
  })

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  function startEdit(event: Event) {
    setEditingId(event.id)
    setEditTitle(event.title)
    setEditDate(event.date ?? '')
    setEditVenue(event.venue ?? '')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createEvent.mutate({ title, date: date || undefined, venue: venue || undefined })
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    updateEvent.mutate({ id: editingId, title: editTitle, date: editDate || undefined, venue: editVenue || undefined })
  }

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
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800">New Event</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name <span className="text-burgundy-600">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Sarah & John's Wedding"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. The Grand Ballroom"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >
              {createEvent.isPending ? 'Creating...' : 'Create'}
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
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No events yet.</p>
          <p className="text-sm mt-1">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) =>
            editingId === event.id ? (
              <form
                key={event.id}
                onSubmit={handleUpdate}
                className="bg-white border border-burgundy-200 rounded-2xl p-6 space-y-3"
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  placeholder="Event name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                  />
                  <input
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    placeholder="Venue"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updateEvent.isPending}
                    className="flex-1 bg-burgundy-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900 text-2xl leading-tight mb-1">
                      {event.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {event.date && <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                      {event.venue && <span>· {event.venue}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => startEdit(event)}
                      style={{ color: '#7a6a60' }}
                      className="hover:text-burgundy-600 text-base px-2 py-1 transition-colors"
                      title="Edit event"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteEvent.mutate(event.id)}
                      style={{ color: '#7a6a60' }}
                      className="hover:text-red-500 text-xl leading-none px-1 transition-colors"
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Guests', path: 'guests', icon: '👥', gray: true, textColor: undefined },
                    { label: 'Tasks', path: 'tasks', icon: '✓', gray: false, textColor: '#555' },
                    { label: 'Vendors', path: 'vendors', icon: '🤝🏼', gray: false, textColor: undefined },
                    { label: 'Budget', path: 'budget', icon: '₪', gray: false, textColor: '#555' },
                    { label: 'Seating', path: 'seating', icon: '🪑', gray: false, textColor: undefined },
                  ].map(({ label, path, icon, gray, textColor }) => (
                    <Link
                      key={path}
                      to={`/events/${event.id}/${path}`}
                      className="flex flex-col items-center gap-2 text-burgundy-700 border border-burgundy-200 rounded-xl py-4 hover:bg-burgundy-50 transition-colors"
                    >
                      <span className="text-2xl" style={{ ...(gray ? { filter: 'grayscale(1)' } : {}), ...(textColor ? { color: textColor } : {}) }}>{icon}</span>
                      <span className="text-sm font-semibold">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
