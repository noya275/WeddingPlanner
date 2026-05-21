import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import api from '../api/client'
import type { Guest } from '../api/types'

const TABLE_SIZE = 200   // circle diameter
const CONTAINER = 360    // total space per table (for names outside)
const SEAT_RING = 115    // distance from center to seat center
const NAME_OFFSET = 24   // extra distance beyond seat for name label

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
      className={`select-none cursor-grab active:cursor-grabbing rounded-lg px-2 py-1 text-xs font-medium border bg-white shadow-sm text-gray-800 transition-opacity
        ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      {guest.name}
    </div>
  )
}

function SeatPosition({ guest, angle, isDragging }: { guest: Guest | null; angle: number; isDragging: boolean }) {
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
        style={{ position: 'absolute', left: sx - 10, top: sy - 10, width: 20, height: 20 }}
        className={`rounded-full border-2 ${guest ? 'bg-burgundy-100 border-burgundy-400' : 'bg-gray-100 border-gray-200'}`}
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
            opacity: thisDragging || isDragging ? 0 : 1,
            whiteSpace: 'nowrap',
          }}
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing select-none text-xs font-medium bg-white/90 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 shadow-sm"
        >
          {guest.name}
        </div>
      )}
    </>
  )
}

function TableZone({ tableNum, guests, capacity }: { tableNum: number; guests: Guest[]; capacity: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${tableNum}` })
  const cx = CONTAINER / 2
  const cy = CONTAINER / 2
  const filled = guests.length
  const slots = Math.max(capacity, filled)

  return (
    <div style={{ width: CONTAINER, height: CONTAINER, position: 'relative', flexShrink: 0 }}>
      {/* Table circle — drop zone */}
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          left: cx - TABLE_SIZE / 2,
          top: cy - TABLE_SIZE / 2,
          width: TABLE_SIZE,
          height: TABLE_SIZE,
          borderRadius: '50%',
        }}
        className={`border-4 bg-white/60 backdrop-blur-sm transition-colors flex flex-col items-center justify-center
          ${guests.length >= capacity ? 'border-red-300' : isOver ? 'border-burgundy-500' : 'border-gray-300'}`}
      >
        <p className="text-sm font-bold text-gray-600">Table {tableNum}</p>
        <p className="text-xs text-gray-400">{filled}/{capacity}</p>
        {isOver && (
          <div className="absolute inset-0 rounded-full bg-burgundy-50/40 pointer-events-none" />
        )}
      </div>

      {/* Seats around the table */}
      {Array.from({ length: slots }, (_, i) => {
        const angle = (i / slots) * 2 * Math.PI - Math.PI / 2
        return (
          <SeatPosition
            key={i}
            angle={angle}
            guest={guests[i] ?? null}
            isDragging={false}
          />
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
      className={`bg-white/60 backdrop-blur-sm rounded-xl border-2 transition-colors p-3 min-h-[80px]
        ${isOver ? 'border-burgundy-400 border-dashed' : 'border-gray-200'}`}
    >
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Unassigned ({guests.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {guests.map((g) => <DraggableGuest key={g.id} guest={g} />)}
        {guests.length === 0 && <p className="text-xs text-gray-300 italic">All guests seated!</p>}
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
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-base font-bold">← Events</Link>
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

      <DndContext sensors={sensors} modifiers={[snapCenterToCursor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="mb-8">
          <UnassignedZone guests={unassigned} />
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
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
