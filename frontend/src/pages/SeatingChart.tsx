import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import api from '../api/client'
import type { Guest } from '../api/types'

const TABLE_SIZE = 200
const CONTAINER = 380
const SEAT_RING = 115
const NAME_OFFSET = 28

function DraggableGuest({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: guest.id })
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50, position: 'relative' as const }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none cursor-grab active:cursor-grabbing rounded-full px-3 py-1 text-sm font-medium border border-burgundy-200 bg-white shadow-sm text-burgundy-800 transition-opacity
        ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      {guest.name}
    </div>
  )
}

function SeatPosition({ guest, angle }: { guest: Guest | null; angle: number }) {
  const cx = CONTAINER / 2
  const cy = CONTAINER / 2
  const sx = cx + Math.cos(angle) * SEAT_RING
  const sy = cy + Math.sin(angle) * SEAT_RING
  const nx = cx + Math.cos(angle) * (SEAT_RING + NAME_OFFSET)
  const ny = cy + Math.sin(angle) * (SEAT_RING + NAME_OFFSET)

  const { attributes, listeners, setNodeRef, transform, isDragging: thisDragging } = useDraggable({
    id: guest?.id ?? `empty-${angle}`,
    disabled: !guest,
  })

  return (
    <>
      {/* Seat dot */}
      <div
        style={{ position: 'absolute', left: sx - 11, top: sy - 11, width: 22, height: 22 }}
        className={`rounded-full border-2 shadow-sm transition-colors
          ${guest ? 'bg-[#f2dda2] border-[#d4b86a]' : 'bg-white/70 border-gray-300'}`}
      />
      {/* Guest name label */}
      {guest && (
        <div
          ref={setNodeRef}
          style={{
            position: 'absolute',
            left: nx,
            top: ny,
            transform: `translate(-50%, -50%)${transform ? ` translate(${transform.x}px, ${transform.y}px)` : ''}`,
            zIndex: thisDragging ? 50 : 1,
            opacity: thisDragging ? 0 : 1,
            whiteSpace: 'nowrap',
          }}
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing select-none text-xs font-semibold bg-white border border-burgundy-200 rounded-full px-2 py-0.5 text-burgundy-800 shadow-md"
        >
          {guest.name}
        </div>
      )}
    </>
  )
}

function TableZone({ tableNum, guests, capacity, isDone, onToggleDone }: { tableNum: number; guests: Guest[]; capacity: number; isDone: boolean; onToggleDone: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${tableNum}` })
  const cx = CONTAINER / 2
  const cy = CONTAINER / 2
  const filled = guests.length
  const slots = Math.max(capacity, filled)

  return (
    <div style={{ width: CONTAINER, height: CONTAINER, position: 'relative', flexShrink: 0 }}>
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          left: cx - TABLE_SIZE / 2,
          top: cy - TABLE_SIZE / 2,
          width: TABLE_SIZE,
          height: TABLE_SIZE,
          borderRadius: '50%',
          background: isDone
            ? 'radial-gradient(circle, rgba(150,176,106,0.25) 0%, rgba(225,235,210,0.82) 100%)'
            : isOver
            ? 'radial-gradient(circle, rgba(160,100,110,0.18) 0%, rgba(245,235,237,0.85) 100%)'
            : 'radial-gradient(circle, rgba(210,180,140,0.35) 0%, rgba(255,248,240,0.75) 100%)',
        }}
        className={`border-4 backdrop-blur-sm transition-all flex flex-col items-center justify-center shadow-lg
          ${isDone ? 'border-[#96b06a]' : isOver ? 'border-[#a06070]' : 'border-[#c8a882]'}`}
      >
        <p className="text-base font-bold text-gray-700 tracking-wide">Table {tableNum}</p>
        <p className="text-xs font-semibold mt-0.5 text-gray-400">
          {filled}/{capacity}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleDone() }}
          className={`mt-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors select-none
            ${isDone ? 'bg-[#d4f0e8] border-[#96b06a] text-[#2a8a6e]' : 'bg-white/60 border-gray-300 text-gray-400 hover:border-[#96b06a] hover:text-[#2a8a6e]'}`}
        >
          {isDone ? '✓ Done' : 'Mark done'}
        </button>
        {isOver && <div className="absolute inset-0 rounded-full bg-burgundy-50/30 pointer-events-none" />}
      </div>

      {Array.from({ length: slots }, (_, i) => {
        const angle = (i / slots) * 2 * Math.PI - Math.PI / 2
        return (
          <SeatPosition key={i} angle={angle} guest={guests[i] ?? null} />
        )
      })}
    </div>
  )
}

function UnassignedZone({ guests }: { guests: Guest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 transition-all p-4 min-h-[90px]
        ${isOver ? 'border-burgundy-400 border-dashed bg-burgundy-50/40' : 'border-[#d4b896] bg-white/50 backdrop-blur-sm'}`}
    >
      <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-widest">
        Unassigned · <span className="text-2xl">{guests.length}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {guests.map((g) => <DraggableGuest key={g.id} guest={g} />)}
        {guests.length === 0 && (
          <p className="text-sm italic" style={{ color: '#aba098' }}>All guests are seated 🎉</p>
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
  const [doneTables, setDoneTables] = useState<Set<number>>(new Set())

  function toggleDone(n: number) {
    setDoneTables((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ['guests', eventId],
    queryFn: () => api.get(`/events/${eventId}/guests`).then((r) => r.data),
    refetchInterval: 5000,
  })

  const updateGuest = useMutation({
    mutationFn: ({ id, table_number }: { id: number; table_number: number | null }) =>
      api.patch(`/events/${eventId}/guests/${id}`, { table_number }).then((r) => r.data),
    onMutate: async ({ id, table_number }) => {
      await queryClient.cancelQueries({ queryKey: ['guests', eventId] })
      const previous = queryClient.getQueryData<Guest[]>(['guests', eventId])
      queryClient.setQueryData(['guests', eventId], (old: Guest[] = []) =>
        old.map((g) => (g.id === id ? { ...g, table_number } : g))
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(['guests', eventId], context.previous)
    },
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
    if (isNaN(guestId)) return
    if (over.id === 'unassigned') {
      updateGuest.mutate({ id: guestId, table_number: null })
    } else {
      const tableNum = parseInt(String(over.id).replace('table-', ''))
      if (!isNaN(tableNum)) updateGuest.mutate({ id: guestId, table_number: tableNum })
    }
  }

  const unassigned = guests.filter((g) => !g.table_number)
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-600 font-semibold">
            Tables:
            <input type="number" min={1} max={30} value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
              name="table-count"
              autoComplete="off"
              className="w-14 border border-[#d4b896] rounded-lg px-2 py-1 text-center bg-white/60 focus:outline-none focus:ring-2 focus:ring-burgundy-400" />
          </label>
          <label className="flex items-center gap-2 text-gray-600 font-semibold">
            Seats/table:
            <input type="number" min={1} max={30} value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              name="table-capacity"
              autoComplete="off"
              className="w-14 border border-[#d4b896] rounded-lg px-2 py-1 text-center bg-white/60 focus:outline-none focus:ring-2 focus:ring-burgundy-400" />
          </label>
        </div>
      </div>

      <DndContext sensors={sensors} modifiers={[snapCenterToCursor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Unassigned */}
        <div className="mb-8">
          <UnassignedZone guests={unassigned} />
        </div>

        {/* Floor plan */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(245, 235, 220, 0.35)',
            border: '1px solid rgba(200, 168, 130, 0.4)',
            backdropFilter: 'blur(6px)',
            backgroundImage: 'radial-gradient(circle, rgba(200,168,130,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div className="grid grid-cols-3 gap-6 justify-items-center">
            {tables.map((n) => (
              <TableZone
                key={n}
                tableNum={n}
                capacity={capacity}
                guests={guests.filter((g) => g.table_number === n)}
                isDone={doneTables.has(n)}
                onToggleDone={() => toggleDone(n)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeGuest && (
            <div className="bg-white border-2 border-burgundy-300 shadow-xl rounded-full px-4 py-1.5 text-sm font-semibold text-burgundy-800 cursor-grabbing">
              {activeGuest.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
