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

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events/').then((r) => r.data),
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

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createEvent.mutate({ title, date: date || undefined, venue: venue || undefined })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
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
                Event Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Sarah & John's Wedding"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. The Grand Ballroom"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
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
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                  {event.title}
                </h2>
                <button
                  onClick={() => deleteEvent.mutate(event.id)}
                  className="text-gray-300 hover:text-red-500 text-lg leading-none ml-2"
                  title="Delete event"
                >
                  ×
                </button>
              </div>
              {event.date && (
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              )}
              {event.venue && <p className="text-sm text-gray-500 mb-4">{event.venue}</p>}
              <div className="flex gap-2 mt-4">
                <Link
                  to={`/events/${event.id}/guests`}
                  className="flex-1 text-center text-xs font-medium text-rose-600 border border-rose-200 rounded-lg py-1.5 hover:bg-rose-50 transition-colors"
                >
                  Guests
                </Link>
                <Link
                  to={`/events/${event.id}/tasks`}
                  className="flex-1 text-center text-xs font-medium text-rose-600 border border-rose-200 rounded-lg py-1.5 hover:bg-rose-50 transition-colors"
                >
                  Tasks
                </Link>
                <Link
                  to={`/events/${event.id}/vendors`}
                  className="flex-1 text-center text-xs font-medium text-rose-600 border border-rose-200 rounded-lg py-1.5 hover:bg-rose-50 transition-colors"
                >
                  Vendors
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
