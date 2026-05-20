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
    <div className="min-h-screen animate-fadein" style={{ backgroundColor: '#c9b8a8' }}>
      <nav className="bg-[#fdf8f3] shadow-sm border-b border-[#e8ddd4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold text-burgundy-700 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Wedding Planner
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
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
  )
}
