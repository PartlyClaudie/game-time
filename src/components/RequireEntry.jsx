import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export const GUEST_KEY = 'game-hub:guest'

export default function RequireEntry({ children }) {
  const { user, loading } = useAuth()
  const [isGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true')

  if (loading) {
    return <div className="entry-loading">Loading…</div>
  }

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return children
}