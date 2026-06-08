/**
 * Shared test utilities.
 *
 * renderWithProviders — wraps a component with React Query and React Router before rendering.
 * Any component that calls useQuery, useMutation, useNavigate, or Link will crash in tests
 * without these providers, so use this instead of the bare render() from @testing-library/react.
 *
 * retry: false prevents React Query from retrying failed requests in tests, which would
 * cause tests to hang waiting for retries that will never succeed.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}
