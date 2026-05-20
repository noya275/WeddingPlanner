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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) =>
            editingId === event.id ? (
              <form
                key={event.id}
                onSubmit={handleUpdate}
                className="bg-white border border-burgundy-200 rounded-xl p-5 space-y-3"
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  placeholder="Event name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                />
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
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updateEvent.isPending}
                    className="flex-1 bg-burgundy-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                    {event.title}
                  </h2>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => startEdit(event)}
                      className="text-gray-300 hover:text-burgundy-600 text-sm px-1"
                      title="Edit event"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteEvent.mutate(event.id)}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none"
                      title="Delete event"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {event.date && (
                  <p className="text-sm text-gray-500 mb-1">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                )}
                {event.venue && <p className="text-sm text-gray-500 mb-4">{event.venue}</p>}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Link
                    to={`/events/${event.id}/guests`}
                    className="flex-1 text-center text-xs font-medium text-burgundy-700 border border-burgundy-200 rounded-lg py-1.5 hover:bg-burgundy-50 transition-colors"
                  >
                    Guests
                  </Link>
                  <Link
                    to={`/events/${event.id}/tasks`}
                    className="flex-1 text-center text-xs font-medium text-burgundy-700 border border-burgundy-200 rounded-lg py-1.5 hover:bg-burgundy-50 transition-colors"
                  >
                    Tasks
                  </Link>
                  <Link
                    to={`/events/${event.id}/vendors`}
                    className="flex-1 text-center text-xs font-medium text-burgundy-700 border border-burgundy-200 rounded-lg py-1.5 hover:bg-burgundy-50 transition-colors"
                  >
                    Vendors
                  </Link>
                  <Link
                    to={`/events/${event.id}/budget`}
                    className="flex-1 text-center text-xs font-medium text-burgundy-700 border border-burgundy-200 rounded-lg py-1.5 hover:bg-burgundy-50 transition-colors"
                  >
                    Budget
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
