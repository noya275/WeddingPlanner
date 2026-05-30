export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'maybe'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface Event {
  id: number
  title: string
  date: string | null
  venue: string | null
  description: string | null
  budget_total: number | null
  created_at: string
}

export interface Guest {
  id: number
  event_id: number
  name: string
  email: string | null
  phone: string | null
  rsvp_status: RSVPStatus
  dietary_restrictions: string | null
  plus_one: boolean
  table_number: number | null
  notes: string | null
  rsvp_token: string | null
  rsvp_sent: boolean
  side: 'bride' | 'groom' | null
}

export interface Task {
  id: number
  event_id: number
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  status: TaskStatus
  category: string | null
}

export interface RSVPInfo {
  name: string
  rsvp_status: string
  event_title: string
  event_date: string | null
}

export interface Vendor {
  id: number
  event_id: number
  name: string
  vendor_name: string | null
  category: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  price: number | null
  actual: number | null
  is_paid: boolean
  sort_order: number
  notes: string | null
}
