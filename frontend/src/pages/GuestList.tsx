import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Guest, RSVPStatus } from '../api/types'

const STATUS_COLORS: Record<RSVPStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function GuestList() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [plusOne, setPlusOne] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ['guests', eventId],
    queryFn: () => api.get(`/events/${eventId}/guests`).then((r) => r.data),
  })

  const createGuest = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/guests`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
      setShowForm(false)
      setName('')
      setEmail('')
      setPhone('')
      setPlusOne(false)
    },
  })

  const updateGuest = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name: string; email: string | null; phone: string | null }) =>
      api.patch(`/events/${eventId}/guests/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] })
      setEditingId(null)
    },
  })

  const updateRSVP = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RSVPStatus }) =>
      api.patch(`/events/${eventId}/guests/${id}`, { rsvp_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guests', eventId] }),
  })

  const deleteGuest = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/guests/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guests', eventId] }),
  })

  function startEdit(guest: Guest) {
    setEditingId(guest.id)
    setEditName(guest.name)
    setEditEmail(guest.email ?? '')
    setEditPhone(guest.phone ?? '')
  }

  function saveEdit(id: number) {
    updateGuest.mutate({ id, name: editName, email: editEmail || null, phone: editPhone || null })
  }

  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Confirmed', count: confirmed, color: 'text-green-600' },
          { label: 'Pending', count: pending, color: 'text-yellow-600' },
          { label: 'Declined', count: declined, color: 'text-red-600' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{guests.length} guests total</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800"
        >
          + Add Guest
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createGuest.mutate({ name, email: email || null, phone: phone || null, plus_one: plusOne })
          }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-burgundy-600">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={plusOne}
              onChange={(e) => setPlusOne(e.target.checked)}
              className="rounded"
            />
            Plus one
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createGuest.isPending}
              className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >
              Add
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
      ) : guests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No guests yet. Add your first guest above.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">RSVP</th>
                <th className="px-4 py-3 text-left">+1</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map((guest) =>
                editingId === guest.id ? (
                  <tr key={guest.id} className="bg-burgundy-50">
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                        />
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Phone"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">—</td>
                    <td className="px-4 py-2 text-gray-500">{guest.plus_one ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => saveEdit(guest.id)}
                          disabled={updateGuest.isPending}
                          className="text-xs bg-burgundy-700 text-white px-2 py-1 rounded hover:bg-burgundy-800 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {guest.email || guest.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={guest.rsvp_status}
                        onChange={(e) =>
                          updateRSVP.mutate({ id: guest.id, status: e.target.value as RSVPStatus })
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[guest.rsvp_status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{guest.plus_one ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(guest)}
                          className="text-gray-300 hover:text-burgundy-600 text-sm px-1"
                          title="Edit guest"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteGuest.mutate(guest.id)}
                          className="text-gray-300 hover:text-red-500 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
