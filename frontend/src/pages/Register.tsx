import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import axios from 'axios'
import api from '../api/client'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const register = useMutation({
    mutationFn: () => api.post('/auth/register', { name, email, password }),
    onSuccess: () => navigate('/login'),
  })

  const errorMessage = register.error
    ? (axios.isAxiosError(register.error)
        ? register.error.response?.data?.detail ?? 'Registration failed'
        : 'Registration failed')
    : null

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
          <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
          <p className="text-white/70 text-sm mb-5">Start planning your perfect wedding</p>

          <form onSubmit={(e) => { e.preventDefault(); register.mutate() }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
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
                minLength={8}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-3 text-white text-sm">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-burgundy-700 text-white py-2 px-4 rounded-lg hover:bg-burgundy-800 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {register.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
