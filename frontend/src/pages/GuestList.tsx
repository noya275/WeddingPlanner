import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Guest, RSVPStatus } from '../api/types'
import EditableCell from '../components/EditableCell'

const STATUS_COLORS: Record<RSVPStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  maybe: 'bg-orange-100 text-orange-600',
}

type GuestPatch = { id: number; name?: string; email?: string | null; phone?: string | null; plus_one?: boolean; rsvp_status?: RSVPStatus; rsvp_sent?: boolean }

export default function GuestList() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [plusOne, setPlusOne] = useState(false)

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
    mutationFn: ({ id, ...data }: GuestPatch) =>
      api.patch(`/events/${eventId}/guests/${id}`, data).then((r) => r.data),
    onSuccess: (updated: Guest) => {
      queryClient.setQueryData(['guests', eventId], (old: Guest[] = []) =>
        old.map((g) => (g.id === updated.id ? updated : g))
      )
    },
  })

  const deleteGuest = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/guests/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guests', eventId] }),
  })

  function buildWhatsAppUrl(guest: Guest) {
    if (!guest.rsvp_token || !guest.phone) return null
    const rsvpUrl = `${window.location.origin}/rsvp/${guest.rsvp_token}`
    const msg = `Hi ${guest.name}! You're invited to our wedding 💍\nPlease let us know if you'll be joining us:\n${rsvpUrl}`
    return `whatsapp://send?phone=${guest.phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`
  }

  const ensureToken = useMutation({
    mutationFn: (id: number) =>
      api.post(`/events/${eventId}/guests/${id}/rsvp-token`).then((r) => r.data as Guest),
    onSuccess: (updated) => {
      queryClient.setQueryData(['guests', eventId], (old: Guest[] = []) =>
        old.map((g) => (g.id === updated.id ? updated : g))
      )
      openWhatsAppLink(updated)
    },
  })

  function openWhatsAppLink(guest: Guest) {
    const url = buildWhatsAppUrl(guest)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Mark as sent
    updateGuest.mutate({ id: guest.id, rsvp_sent: true })
  }

  function handleSendRSVP(guest: Guest) {
    if (!guest.phone) return
    if (guest.rsvp_token) {
      openWhatsAppLink(guest)
    } else {
      ensureToken.mutate(guest.id)
    }
  }

  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length
  const maybe = guests.filter((g) => g.rsvp_status === 'maybe').length
  const sent = guests.filter((g) => g.rsvp_sent).length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Events</Link>
        <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Confirmed', count: confirmed, color: 'text-green-600' },
          { label: 'Pending', count: pending, color: 'text-yellow-600' },
          { label: 'Maybe', count: maybe, color: 'text-orange-500' },
          { label: 'Declined', count: declined, color: 'text-red-600' },
          { label: 'Invite Sent', count: sent, color: 'text-blue-600' },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-burgundy-600">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} className="rounded" />
            Plus one
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={createGuest.isPending}
              className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50">
              Add
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
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
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">RSVP</th>
                <th className="px-4 py-3 text-center">+1</th>
                <th className="px-4 py-3 text-left">Invite</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-2 font-medium text-gray-900 min-w-[140px]">
                    <EditableCell
                      value={guest.name}
                      bold
                      onSave={(v) => v && updateGuest.mutate({ id: guest.id, name: v })}
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[160px]">
                    <EditableCell
                      value={guest.email}
                      type="email"
                      placeholder="add email"
                      emptyDisplay="—"
                      onSave={(v) => updateGuest.mutate({ id: guest.id, email: v })}
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[140px]">
                    <EditableCell
                      value={guest.phone}
                      placeholder="add phone"
                      emptyDisplay="—"
                      onSave={(v) => updateGuest.mutate({ id: guest.id, phone: v })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={guest.rsvp_status}
                      onChange={(e) => updateGuest.mutate({ id: guest.id, rsvp_status: e.target.value as RSVPStatus })}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[guest.rsvp_status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="maybe">Maybe</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => updateGuest.mutate({ id: guest.id, plus_one: !guest.plus_one })}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${guest.plus_one ? 'bg-burgundy-100 text-burgundy-700 hover:bg-burgundy-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {guest.plus_one ? '+1' : '—'}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {guest.phone ? (
                      <div className="flex items-center gap-1.5">
                        {guest.rsvp_sent ? (
                          <>
                            <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                              <span>✓</span> Sent
                            </span>
                            <button
                              onClick={() => handleSendRSVP(guest)}
                              className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                              title="Resend RSVP"
                            >
                              ↺
                            </button>
                            <button
                              onClick={() => updateGuest.mutate({ id: guest.id, rsvp_sent: false })}
                              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
                              title="Mark as not sent"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSendRSVP(guest)}
                            disabled={ensureToken.isPending && ensureToken.variables === guest.id}
                            className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Send RSVP via WhatsApp"
                          >
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Send RSVP
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">No phone</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteGuest.mutate(guest.id)}
                      className="text-gray-200 hover:text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
