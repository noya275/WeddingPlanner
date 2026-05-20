import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      if (rememberMe) form.append('scope', 'remember_me')
      const { data } = await api.post('/auth/login', form)
      if (rememberMe) {
        localStorage.setItem('token', data.access_token)
      } else {
        sessionStorage.setItem('token', data.access_token)
      }
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage: 'url(/WedBG.png)', backgroundSize: 'cover', backgroundPosition: 'center 40%' }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-xs mx-4 animate-fadein">
        <div className="text-center mb-6">
          <h1 className="text-5xl text-white drop-shadow-lg" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.05em' }}>
            Wedding Planner
          </h1>
          <p className="text-white/80 text-sm mt-2 tracking-widest uppercase">Plan your perfect day</p>
        </div>

        <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-5">
        <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-white/70 text-sm mb-5">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-burgundy-700"
            />
            Remember me for a year
          </label>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy-700 text-white py-2 px-4 rounded-lg hover:bg-burgundy-800 font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-white hover:underline font-medium">
            Register
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
