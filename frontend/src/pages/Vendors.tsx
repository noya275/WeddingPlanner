import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Vendor, VendorStatus } from '../api/types'

const STATUS_COLORS: Record<VendorStatus, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-600',
  booked: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-600',
}

export default function Vendors() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [price, setPrice] = useState('')

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors', eventId],
    queryFn: () => api.get(`/events/${eventId}/vendors`).then((r) => r.data),
  })

  const createVendor = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/vendors`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', eventId] })
      setShowForm(false)
      setName('')
      setCategory('')
      setContactName('')
      setContactEmail('')
      setContactPhone('')
      setPrice('')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorStatus }) =>
      api.patch(`/events/${eventId}/vendors/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors', eventId] }),
  })

  const deleteVendor = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/vendors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors', eventId] }),
  })

  const totalBooked = vendors
    .filter((v) => v.status === 'booked' && v.price)
    .reduce((sum, v) => sum + (v.price ?? 0), 0)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
      </div>

      {totalBooked > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 inline-block">
          <p className="text-sm text-gray-500">Total booked</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalBooked.toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800"
        >
          + Add Vendor
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createVendor.mutate({
              name,
              category: category || null,
              contact_name: contactName || null,
              contact_email: contactEmail || null,
              contact_phone: contactPhone || null,
              price: price ? parseFloat(price) : null,
            })
          }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name <span className="text-burgundy-600">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. ABC Photography"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Photography, Catering"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createVendor.isPending}
              className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >
              Add Vendor
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
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No vendors yet. Add your first vendor above.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-500">{vendor.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {vendor.contact_email || vendor.contact_phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {vendor.price != null ? `$${Number(vendor.price).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={vendor.status}
                      onChange={(e) =>
                        updateStatus.mutate({ id: vendor.id, status: e.target.value as VendorStatus })
                      }
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[vendor.status]}`}
                    >
                      <option value="prospect">Prospect</option>
                      <option value="contacted">Contacted</option>
                      <option value="booked">Booked</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteVendor.mutate(vendor.id)}
                      className="text-gray-300 hover:text-red-500 text-lg"
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
