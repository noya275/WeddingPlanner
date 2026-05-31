import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string | number | null | undefined
  onSave: (val: string | null) => void
  type?: 'text' | 'email' | 'number' | 'date'
  placeholder?: string
  emptyDisplay?: string
  bold?: boolean
}

export default function EditableCell({ value, onSave, type = 'text', placeholder = '—', emptyDisplay = '—', bold = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  // Keep local val in sync if parent value changes (e.g. after save)
  useEffect(() => {
    if (!editing) setVal(value != null ? String(value) : '')
  }, [value, editing])

  function commit() {
    setEditing(false)
    const newVal = val.trim() || null
    const oldVal = value != null ? String(value).trim() || null : null
    if (newVal !== oldVal) onSave(newVal)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setVal(value != null ? String(value) : ''); setEditing(false) }
  }

  const isEmpty = value == null || value === ''

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full bg-white border border-burgundy-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`block w-full cursor-text rounded px-2 py-0.5 -mx-2 hover:bg-burgundy-50 transition-colors ${bold ? 'font-medium text-gray-900' : 'text-gray-600'} ${isEmpty ? 'text-gray-400 italic' : ''}`}
    >
      {isEmpty ? emptyDisplay : String(value)}
    </span>
  )
}
