import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import GuestList from './pages/GuestList'
import Tasks from './pages/Tasks'
import Vendors from './pages/Vendors'
import Budget from './pages/Budget'
import RSVPPage from './pages/RSVP'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route path="events/:eventId/guests" element={<GuestList />} />
            <Route path="events/:eventId/tasks" element={<Tasks />} />
            <Route path="events/:eventId/vendors" element={<Vendors />} />
            <Route path="events/:eventId/budget" element={<Budget />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
