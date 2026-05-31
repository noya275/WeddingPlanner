import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import GuestList from './pages/GuestList'
import Tasks from './pages/Tasks'
import Vendors from './pages/Vendors'
import RSVPPage from './pages/RSVP'
import SeatingChart from './pages/SeatingChart'
import Layout from './components/Layout'
import EventLayout from './components/EventLayout'
import { getToken } from './api/client'

const queryClient = new QueryClient()

/** Redirects unauthenticated users to /login; renders children when a token is present. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

/** Root component: wraps the app in React Query and React Router, declares all routes. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rsvp/:token" element={<RSVPPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="events/:eventId" element={<EventLayout />}>
              <Route index element={<Navigate to="guests" replace />} />
              <Route path="guests" element={<GuestList />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="seating" element={<SeatingChart />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
