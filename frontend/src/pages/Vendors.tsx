import { useState, useRef, useEffect, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { Vendor, Event } from '../api/types'
import EditableCell from '../components/EditableCell'

const CATEGORIES = [
  {
    name: 'Bride',
    items: ['Wedding Dress', "Bride's Shoes", "Bride's Jewelry", "Bride's Makeup", "Bride's Hair", 'Pre-Wedding Facial', "Bride's Nails", 'Bridal Bouquet'],
  },
  {
    name: 'Groom',
    items: ["Groom's Suit", "Groom's Shoes", "Groom's Accessories", "Groom's Haircut & Grooming"],
  },
  {
    name: 'Venue / Hall',
    items: ['Event Venue', 'Lighting & Sound', 'Chuppah Design', 'ACUM License Fee', 'Venue Staff Tips'],
  },
  {
    name: 'Rabbinate',
    items: ['Rabbinate Registration', 'Officiating Rabbi', 'Wedding Rings', 'Ring Pillow'],
  },
  {
    name: 'Vehicle / Transportation',
    items: ['Wedding Car Rental', 'Car Decoration', 'Transportation / Buses'],
  },
  {
    name: 'Must-Have Vendors',
    items: ['DJ', 'Photographer', 'Alcohol', 'Wedding Invitations', 'RSVP', 'Wedding Gimmicks'],
  },
  {
    name: 'Optional Vendors',
    items: ['Photo Magnets', 'Attractions (Photo Booth, etc.)', 'Guest Gifts', 'External Wedding Planner', 'Post-Event Hotel', 'Singer / Entertainer'],
  },
]

const KNOWN_CATEGORIES = new Set(CATEGORIES.map((c) => c.name))

const CATEGORY_CELL = 'px-3 py-2 text-xs font-bold uppercase tracking-wider text-burgundy-700 bg-gray-50 border-r border-gray-200 align-top w-28'

function AddRow({
  onAdd,
  category,
  withCategoryCell,
  categoryRowSpan,
}: {
  onAdd: (name: string, category: string) => void
  category: string
  withCategoryCell?: boolean
  categoryRowSpan?: number
}) {
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), category)
    setName('')
    setTimeout(() => nameRef.current?.focus(), 0)
  }

  return (
    <tr className="border-t border-dashed border-gray-200">
      {withCategoryCell && (
        <td rowSpan={categoryRowSpan ?? 1} className={CATEGORY_CELL}>
          <span className="inline-block pt-1">{category}</span>
        </td>
      )}
      <td className="px-4 py-2" colSpan={2}>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          onBlur={() => { if (name.trim()) submit() }}
          placeholder="+ Add vendor..."
          className="w-full text-sm outline-none bg-transparent text-gray-700 guest-add-input"
        />
      </td>
      <td colSpan={5} />
    </tr>
  )
}

function InlineAddRow({
  category,
  onAdd,
  onCancel,
}: {
  category: string
  onAdd: (name: string, category: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  function submit() {
    if (name.trim()) onAdd(name.trim(), category)
    else onCancel()
  }

  return (
    <tr className="border-t border-burgundy-200 bg-burgundy-50/40">
      <td className="px-4 py-1.5" colSpan={2}>
        <input
          ref={ref}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); submit() }
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          }}
          onBlur={submit}
          placeholder="Vendor type name..."
          className="w-full text-sm outline-none bg-transparent text-gray-700"
        />
      </td>
      <td colSpan={5} />
    </tr>
  )
}

export default function Vendors() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [editBudget, setEditBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [insertAfterId, setInsertAfterId] = useState<number | null>(null)

  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors', eventId],
    queryFn: () => api.get(`/events/${eventId}/vendors`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const updateEventBudget = useMutation({
    mutationFn: (budget_total: number | null) =>
      api.patch(`/events/${eventId}`, { budget_total }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      setEditBudget(false)
    },
  })

  const createVendor = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/vendors`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors', eventId] }),
  })

  const updateVendor = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; vendor_name?: string | null; category?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; actual?: number | null; is_paid?: boolean }) =>
      api.patch(`/events/${eventId}/vendors/${id}`, data).then((r) => r.data),
    onSuccess: (updated: Vendor) => {
      queryClient.setQueryData(['vendors', eventId], (old: Vendor[] = []) =>
        old.map((v) => (v.id === updated.id ? updated : v))
      )
    },
  })

  const deleteVendor = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/vendors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors', eventId] }),
  })

  const fmt = (n: number) => `₪${Math.round(n).toLocaleString()}`
  const budgetTotal = event?.budget_total ?? null
  const totalActual = vendors.reduce((s, v) => s + Number(v.actual ?? 0), 0)
  const remaining = budgetTotal != null ? Number(budgetTotal) - totalActual : null
  const spentPct = budgetTotal ? Math.min(100, Math.round((totalActual / Number(budgetTotal)) * 100)) : null

  const vendorsByCategory: Record<string, Vendor[]> = {}
  for (const cat of CATEGORIES) {
    vendorsByCategory[cat.name] = vendors.filter((v) => v.category === cat.name)
  }
  const otherVendors = vendors.filter((v) => !v.category || !KNOWN_CATEGORIES.has(v.category))

  // categoryLabel: non-null only on the first row of a group (triggers the rowspan cell)
  function renderVendorRow(vendor: Vendor, categoryLabel: string | null, rowSpan: number, isGroupStart: boolean) {
    return (
      <tr
        key={vendor.id}
        className={`hover:bg-gray-50 group ${vendor.is_paid ? 'opacity-60' : ''} ${isGroupStart ? 'border-t-2 border-gray-200' : 'border-t border-gray-100'}`}
      >
        {categoryLabel !== null && (
          <td rowSpan={rowSpan} className={CATEGORY_CELL}>
            <span className="inline-block pt-1">{categoryLabel}</span>
          </td>
        )}
        <td className="px-4 py-2 min-w-[140px]">
          <EditableCell value={vendor.name} bold
            onSave={(v) => v && updateVendor.mutate({ id: vendor.id, name: v })} />
        </td>
        <td className="px-4 py-2 min-w-[140px]">
          <EditableCell value={vendor.vendor_name} placeholder="vendor name" emptyDisplay="—"
            onSave={(v) => updateVendor.mutate({ id: vendor.id, vendor_name: v })} />
        </td>
        <td className="px-4 py-2 min-w-[130px]">
          <EditableCell value={vendor.contact_name} placeholder="contact name" emptyDisplay="—"
            onSave={(v) => updateVendor.mutate({ id: vendor.id, contact_name: v })} />
        </td>
        <td className="px-4 py-2 min-w-[110px]">
          <EditableCell value={vendor.contact_phone} placeholder="phone" emptyDisplay="—"
            onSave={(v) => updateVendor.mutate({ id: vendor.id, contact_phone: v })} />
        </td>
        <td className="px-4 py-2 min-w-[90px]">
          <EditableCell
            value={vendor.actual != null ? String(Math.round(Number(vendor.actual))) : ''}
            type="number" placeholder="0" emptyDisplay="—"
            onSave={(v) => updateVendor.mutate({ id: vendor.id, actual: v ? parseFloat(v) : null })} />
        </td>
        <td className="px-4 py-2 text-center">
          <button
            onClick={() => updateVendor.mutate({ id: vendor.id, is_paid: !vendor.is_paid })}
            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${vendor.is_paid ? 'bg-green-100 text-[#2d7a4a] hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {vendor.is_paid ? 'Paid' : 'Unpaid'}
          </button>
        </td>
        <td className="px-4 py-2 text-right">
          <div className="flex gap-1 justify-end items-center">
            <button
              onClick={() => setInsertAfterId(insertAfterId === vendor.id ? null : vendor.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-base px-1 hover:text-burgundy-600"
              style={{ color: '#7a6a60' }}
              title="Insert row below"
            >+</button>
            <button
              onClick={() => { if (insertAfterId === vendor.id) setInsertAfterId(null); deleteVendor.mutate(vendor.id) }}
              className="hover:text-red-500 text-lg leading-none px-1 transition-colors"
              style={{ color: '#7a6a60' }}
            >×</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors & Budget</h1>
      </div>

      {/* Budget overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Overview</h2>
          {!editBudget && (
            <button
              onClick={() => { setEditBudget(true); setBudgetInput(budgetTotal != null ? String(budgetTotal) : '') }}
              className="text-xs text-burgundy-700 hover:underline"
            >
              {budgetTotal != null ? 'Edit budget' : 'Set budget'}
            </button>
          )}
        </div>
        {editBudget && (
          <div className="flex gap-2 mb-4">
            <input
              type="number" value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Total budget" min="0" step="1"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500 w-48"
            />
            <button
              onClick={() => updateEventBudget.mutate(budgetInput ? parseFloat(budgetInput) : null)}
              disabled={updateEventBudget.isPending}
              className="bg-burgundy-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >Save</button>
            <button onClick={() => setEditBudget(false)} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-base font-bold text-gray-400 mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-gray-900">{budgetTotal != null ? fmt(Number(budgetTotal)) : '—'}</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-400 mb-1">Actual Spend</p>
            <p className="text-3xl font-bold text-gray-700">{fmt(totalActual)}</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-400 mb-1">Remaining</p>
            <p className={`text-3xl font-bold ${remaining != null && remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {remaining != null ? fmt(remaining) : '—'}
            </p>
          </div>
        </div>
        {spentPct != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{spentPct}% spent</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${spentPct >= 100 ? 'bg-red-500' : spentPct >= 80 ? 'bg-amber-500' : 'bg-burgundy-600'}`}
                style={{ width: `${spentPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-28" />
                <th className="px-4 py-3 text-left">Vendor Type</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Contact Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Cost (₪)</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const catVendors = vendorsByCategory[cat.name]
                const insertInCat = insertAfterId !== null && catVendors.some((v) => v.id === insertAfterId)
                const totalRows = catVendors.length + (insertInCat ? 1 : 0) + 1

                return (
                  <Fragment key={cat.name}>
                    {catVendors.length === 0 ? (
                      <AddRow
                        category={cat.name}
                        onAdd={(name, category) => createVendor.mutate({ name, category })}
                        withCategoryCell
                        categoryRowSpan={1}
                      />
                    ) : (
                      <>
                        {catVendors.map((vendor, idx) => (
                          <Fragment key={vendor.id}>
                            {renderVendorRow(vendor, idx === 0 ? cat.name : null, totalRows, idx === 0)}
                            {insertAfterId === vendor.id && (
                              <InlineAddRow
                                category={cat.name}
                                onAdd={(name, category) => { createVendor.mutate({ name, category }); setInsertAfterId(null) }}
                                onCancel={() => setInsertAfterId(null)}
                              />
                            )}
                          </Fragment>
                        ))}
                        <AddRow
                          category={cat.name}
                          onAdd={(name, category) => createVendor.mutate({ name, category })}
                        />
                      </>
                    )}
                  </Fragment>
                )
              })}

              {otherVendors.length > 0 && (
                <Fragment key="other">
                  {(() => {
                    const insertInOther = insertAfterId !== null && otherVendors.some((v) => v.id === insertAfterId)
                    const totalRows = otherVendors.length + (insertInOther ? 1 : 0) + 1
                    return (
                      <>
                        {otherVendors.map((vendor, idx) => (
                          <Fragment key={vendor.id}>
                            {renderVendorRow(vendor, idx === 0 ? 'Other' : null, totalRows, idx === 0)}
                            {insertAfterId === vendor.id && (
                              <InlineAddRow
                                category={vendor.category ?? ''}
                                onAdd={(name, category) => { createVendor.mutate({ name, category }); setInsertAfterId(null) }}
                                onCancel={() => setInsertAfterId(null)}
                              />
                            )}
                          </Fragment>
                        ))}
                        <AddRow
                          category=""
                          onAdd={(name) => createVendor.mutate({ name, category: null })}
                        />
                      </>
                    )
                  })()}
                </Fragment>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
