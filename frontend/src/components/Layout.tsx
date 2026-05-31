import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { clearToken } from '../api/client'

/** Top-level authenticated shell: renders the global nav bar with a logout button and an Outlet for nested routes. */
export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  function logout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen animate-fadein"
      style={{ backgroundImage: 'url(/RedBG.webp)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <nav style={{ backgroundColor: 'rgba(80, 30, 40, 0.55)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(180,120,100,0.3)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold tracking-tight text-amber-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Wedding Planner
            </Link>
            <button
              onClick={logout}
              className="text-sm transition-colors" style={{ color: 'rgba(255,235,210,0.9)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: '1.2rem' }}>
        <div key={location.pathname} className="animate-fadein">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
