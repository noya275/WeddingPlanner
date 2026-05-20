import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import PageTransition from './PageTransition'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen animate-fadein"
      style={{ backgroundImage: 'url(/WedBG.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className="min-h-screen" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <nav style={{ backgroundColor: 'rgba(80, 30, 40, 0.55)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(180,120,100,0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold tracking-tight text-amber-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Wedding Planner
            </Link>
            <button
              onClick={logout}
              className="text-sm text-amber-200/70 hover:text-amber-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      </div>
    </div>
  )
}
