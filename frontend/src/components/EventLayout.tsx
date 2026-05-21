import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { Event } from '../api/types'

const NAV_ITEMS = [
  { label: 'Guests', path: 'guests', icon: '👥', gray: true },
  { label: 'Tasks', path: 'tasks', icon: '✓', text: true },
  { label: 'Vendors & Budget', path: 'vendors', icon: '🤝🏼', gray: false },
  { label: 'Seating', path: 'seating', icon: '🪑', gray: false },
]

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>()

  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then((r) => r.data),
  })

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0 }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-8">
          <Link to="/" className="text-base font-bold text-gray-400 hover:text-gray-600 mb-4 block transition-colors">
            ← Events
          </Link>
          <h2 className="font-bold text-gray-900 text-xl leading-tight mb-1">{event?.title ?? '…'}</h2>
          {event?.date && (
            <p className="text-sm text-gray-500 mb-0.5">
              {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          {event?.venue && <p className="text-sm text-gray-500">{event.venue}</p>}

          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1">
            {NAV_ITEMS.map(({ label, path, icon, gray, text }) => (
              <NavLink
                key={path}
                to={`/events/${eventId}/${path}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-lg font-medium transition-colors
                  ${isActive ? 'bg-burgundy-50 text-burgundy-700' : 'text-gray-600 hover:bg-gray-50'}`
                }
              >
                <span
                  style={{
                    ...(gray ? { filter: 'grayscale(1)' } : {}),
                    ...(text ? { color: '#555' } : {}),
                  }}
                >
                  {icon}
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
