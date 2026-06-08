/**
 * Tests for the Dashboard page — the event listing screen shown after login.
 * The axios client is fully mocked so no real HTTP requests are made.
 * Covers loading state, empty state, event rendering, the create form, and delete.
 */
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from './utils'
import Dashboard from '../src/pages/Dashboard'

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../src/api/client'

const mockEvent = {
  id: 1,
  title: 'My Wedding',
  date: '2026-09-01',
  budget_total: null,
  table_count: 8,
  table_capacity: 10,
  done_tables: [],
  created_at: '2026-01-01T00:00:00',
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('shows loading state initially', () => {
  vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
  renderWithProviders(<Dashboard />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
})

test('shows empty state when no events', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [] })
  renderWithProviders(<Dashboard />)
  await waitFor(() => expect(screen.getByText('No events yet.')).toBeInTheDocument())
})

test('renders event titles', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [mockEvent] })
  renderWithProviders(<Dashboard />)
  await waitFor(() => expect(screen.getByText('My Wedding')).toBeInTheDocument())
})

test('shows + New Event button', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [] })
  renderWithProviders(<Dashboard />)
  expect(screen.getByText('+ New Event')).toBeInTheDocument()
})

test('clicking + New Event shows the form', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [] })
  renderWithProviders(<Dashboard />)
  await userEvent.click(screen.getByText('+ New Event'))
  expect(screen.getByPlaceholderText('Event name')).toBeInTheDocument()
})

test('deletes event when confirmed', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [mockEvent] })
  vi.mocked(api.delete).mockResolvedValue({})
  vi.spyOn(window, 'confirm').mockReturnValue(true)

  renderWithProviders(<Dashboard />)
  await waitFor(() => screen.getByText('My Wedding'))
  await userEvent.click(screen.getByTitle('Delete event'))

  expect(api.delete).toHaveBeenCalledWith('/events/1')
})
