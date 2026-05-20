export type RSVPStatus = 'pending' | 'confirmed' | 'declined'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type VendorStatus = 'prospect' | 'contacted' | 'booked' | 'cancelled'

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

export interface Vendor {
  id: number
  event_id: number
  name: string
  category: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  price: number | null
  status: VendorStatus
  notes: string | null
}

export interface BudgetItem {
  id: number
  event_id: number
  name: string
  category: string | null
  estimated: number | null
  actual: number | null
  is_paid: boolean
}
