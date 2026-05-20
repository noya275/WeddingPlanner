import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { BudgetItem, Event } from '../api/types'
import EditableCell from '../components/EditableCell'

export default function Budget() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemEstimated, setItemEstimated] = useState('')
  const [itemActual, setItemActual] = useState('')
  const [itemPaid, setItemPaid] = useState(false)

  const [editBudget, setEditBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const { data: event } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/events/${eventId}`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const { data: items = [], isLoading } = useQuery<BudgetItem[]>({
    queryKey: ['budget', eventId],
    queryFn: () => api.get(`/events/${eventId}/budget`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const updateEventBudget = useMutation({
    mutationFn: (budget_total: number | null) =>
      api.patch(`/events/${eventId}`, { budget_total }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditBudget(false)
    },
  })

  const createItem = useMutation({
    mutationFn: (payload: object) =>
      api.post(`/events/${eventId}/budget`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', eventId] })
      setShowForm(false)
      setItemName('')
      setItemCategory('')
      setItemEstimated('')
      setItemActual('')
      setItemPaid(false)
    },
  })

  type ItemPatch = { id: number; name?: string; category?: string | null; estimated?: number | null; actual?: number | null; is_paid?: boolean }
  const updateItem = useMutation({
    mutationFn: ({ id, ...payload }: ItemPatch) =>
      api.patch(`/events/${eventId}/budget/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', eventId] })
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${eventId}/budget/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget', eventId] }),
  })

  const totalEstimated = items.reduce((s, i) => s + (i.estimated ?? 0), 0)
  const totalActual = items.reduce((s, i) => s + (i.actual ?? 0), 0)
  const totalPaid = items.filter((i) => i.is_paid).reduce((s, i) => s + (i.actual ?? i.estimated ?? 0), 0)
  const budgetTotal = event?.budget_total ?? null
  const remaining = budgetTotal != null ? budgetTotal - totalActual : null
  const spentPct = budgetTotal ? Math.min(100, Math.round((totalActual / budgetTotal) * 100)) : null

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
      </div>

      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Overview</h2>
          {!editBudget && (
            <button
              onClick={() => {
                setEditBudget(true)
                setBudgetInput(budgetTotal != null ? String(budgetTotal) : '')
              }}
              className="text-xs text-burgundy-700 hover:underline"
            >
              {budgetTotal != null ? 'Edit budget' : 'Set budget'}
            </button>
          )}
        </div>

        {editBudget && (
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Total budget"
              min="0"
              step="1"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500 w-48"
            />
            <button
              onClick={() =>
                updateEventBudget.mutate(budgetInput ? parseFloat(budgetInput) : null)
              }
              disabled={updateEventBudget.isPending}
              className="bg-burgundy-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditBudget(false)}
              className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">
              {budgetTotal != null ? fmt(Number(budgetTotal)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Estimated</p>
            <p className="text-xl font-bold text-gray-700">{fmt(totalEstimated)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Actual Spend</p>
            <p className="text-xl font-bold text-gray-700">{fmt(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${remaining != null && remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {remaining != null ? fmt(remaining) : '—'}
            </p>
          </div>
        </div>

        {spentPct != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{spentPct}% spent</span>
              <span>{fmt(totalPaid)} paid</span>
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

      {/* Items */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Budget Items</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-burgundy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-burgundy-800"
        >
          + Add Item
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createItem.mutate({
              name: itemName,
              category: itemCategory || null,
              estimated: itemEstimated ? parseFloat(itemEstimated) : null,
              actual: itemActual ? parseFloat(itemActual) : null,
              is_paid: itemPaid,
            })
          }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item <span className="text-burgundy-600">*</span>
              </label>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder="e.g. Flowers"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                placeholder="e.g. Decor"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated ($)</label>
              <input
                type="number"
                value={itemEstimated}
                onChange={(e) => setItemEstimated(e.target.value)}
                min="0"
                step="1"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual ($)</label>
              <input
                type="number"
                value={itemActual}
                onChange={(e) => setItemActual(e.target.value)}
                min="0"
                step="1"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={itemPaid}
              onChange={(e) => setItemPaid(e.target.checked)}
              className="rounded"
            />
            Paid
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createItem.isPending}
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
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No budget items yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Estimated</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 group ${item.is_paid ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2 min-w-[160px]">
                      <div className="flex items-center gap-1">
                        {item.is_paid && <span className="text-green-500 text-xs shrink-0">✓</span>}
                        <EditableCell
                          value={item.name}
                          bold
                          onSave={(v) => v && updateItem.mutate({ id: item.id, name: v })}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 min-w-[120px]">
                      <EditableCell
                        value={item.category}
                        placeholder="category"
                        onSave={(v) => updateItem.mutate({ id: item.id, category: v })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right min-w-[100px]">
                      <EditableCell
                        value={item.estimated != null ? String(Math.round(Number(item.estimated))) : ''}
                        type="number"
                        placeholder="0"
                        emptyDisplay="—"
                        onSave={(v) => updateItem.mutate({ id: item.id, estimated: v ? parseFloat(v) : null })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right min-w-[100px]">
                      <EditableCell
                        value={item.actual != null ? String(Math.round(Number(item.actual))) : ''}
                        type="number"
                        placeholder="0"
                        emptyDisplay="—"
                        onSave={(v) => updateItem.mutate({ id: item.id, actual: v ? parseFloat(v) : null })}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => updateItem.mutate({ id: item.id, is_paid: !item.is_paid })}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                          item.is_paid
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.is_paid ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="text-gray-300 hover:text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{fmt(totalEstimated)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{fmt(totalActual)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
