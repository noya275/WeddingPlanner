import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import api from '../api/client'
import type { Guest } from '../api/types'

function DraggableGuest({ guest, small = false }: { guest: Guest; small?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: guest.id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none cursor-grab active:cursor-grabbing rounded-lg px-2 py-1 text-xs font-medium border transition-opacity
        ${isDragging ? 'opacity-0' : 'opacity-100'}
        ${small
          ? 'bg-white/70 border-gray-200 text-gray-700'
          : 'bg-white border-gray-200 text-gray-800 shadow-sm'
        }`}
    >
      {guest.name}
    </div>
  )
}

function TableZone({ tableNum, guests, capacity }: { tableNum: number; guests: Guest[]; capacity: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${tableNum}` })
  const filled = guests.length
  const pct = Math.min(filled / capacity, 1)
  const ringColor = pct === 1 ? 'border-red-400' : isOver ? 'border-burgundy-500' : 'border-gray-300'

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col items-center justify-center rounded-full border-4 transition-colors bg-white/60 backdrop-blur-sm
        ${ringColor}`}
      style={{ width: 140, height: 140 }}
    >
      <p className="text-xs font-bold text-gray-500 mb-1">Table {tableNum}</p>
      <p className="text-xs text-gray-400">{filled}/{capacity}</p>
      <div className="flex flex-wrap justify-center gap-1 mt-1 px-3 max-w-[120px]">
        {guests.slice(0, 6).map((g) => (
          <DraggableGuest key={g.id} guest={g} small />
        ))}
        {guests.length > 6 && (
          <span className="text-[10px] text-gray-400">+{guests.length - 6}</span>
        )}
      </div>
      {isOver && (
        <div className="absolute inset-0 rounded-full bg-burgundy-100/40 border-2 border-dashed border-burgundy-400 pointer-events-none" />
      )}
    </div>
  )
}

function UnassignedZone({ guests }: { guests: Guest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
  return (
    <div
      ref={setNodeRef}
      className={`bg-white/60 backdrop-blur-sm rounded-xl border-2 transition-colors p-3 min-h-[120px]
        ${isOver ? 'border-burgundy-400 border-dashed' : 'border-gray-200'}`}
    >
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Unassigned ({guests.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {guests.map((g) => (
          <DraggableGuest key={g.id} guest={g} />
        ))}
        {guests.length === 0 && (
          <p className="text-xs text-gray-300 italic">All guests seated!</p>
        )}
      </div>
    </div>
  )
}

export default function SeatingChart() {
  const { eventId } = useParams<{ eventId: string }>()
  const queryClient = useQueryClient()
  const [tableCount, setTableCount] = useState(8)
  const [capacity, setCapacity] = useState(10)
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ['guests', eventId],
    queryFn: () => api.get(`/events/${eventId}/guests`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const updateGuest = useMutation({
    mutationFn: ({ id, table_number }: { id: number; table_number: number | null }) =>
      api.patch(`/events/${eventId}/guests/${id}`, { table_number }).then((r) => r.data),
    onSuccess: (updated: Guest) => {
      queryClient.setQueryData(['guests', eventId], (old: Guest[] = []) =>
        old.map((g) => (g.id === updated.id ? updated : g))
      )
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const guest = guests.find((g) => g.id === event.active.id)
    setActiveGuest(guest ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveGuest(null)
    const { active, over } = event
    if (!over) return
    const guestId = active.id as number
    if (over.id === 'unassigned') {
      updateGuest.mutate({ id: guestId, table_number: null })
    } else {
      const tableNum = parseInt(String(over.id).replace('table-', ''))
      if (!isNaN(tableNum)) {
        updateGuest.mutate({ id: guestId, table_number: tableNum })
      }
    }
  }

  const unassigned = guests.filter((g) => !g.table_number)
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Events</Link>
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            Tables:
            <input type="number" min={1} max={30} value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-center bg-white/60 focus:outline-none focus:ring-2 focus:ring-burgundy-400" />
          </label>
          <label className="flex items-center gap-2 text-gray-600">
            Seats/table:
            <input type="number" min={1} max={30} value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-center bg-white/60 focus:outline-none focus:ring-2 focus:ring-burgundy-400" />
          </label>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="mb-6">
          <UnassignedZone guests={unassigned} />
        </div>

        <div className="flex flex-wrap gap-8 justify-center">
          {tables.map((n) => (
            <TableZone
              key={n}
              tableNum={n}
              capacity={capacity}
              guests={guests.filter((g) => g.table_number === n)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeGuest && (
            <div className="bg-white border border-burgundy-300 shadow-lg rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 cursor-grabbing">
              {activeGuest.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
