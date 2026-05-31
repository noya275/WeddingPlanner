import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({ baseURL: BASE_URL })

/** Unauthenticated axios instance used for public endpoints (e.g. RSVP). */
export const publicApi = axios.create({ baseURL: BASE_URL })

/** Read the JWT from whichever storage it was saved to at login. */
export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/** Remove the JWT from both localStorage and sessionStorage on logout. */
export function clearToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

/** Attach the Bearer token to every outgoing authenticated request. */
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Redirect to /login and clear the token whenever the server returns 401. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
