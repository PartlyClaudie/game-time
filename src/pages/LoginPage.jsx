import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const result = mode === 'signup' ? await signUp(username, password) : await signIn(username, password)
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/')
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">Game Hub</p>
        <h1 className="login-title">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>
            Log In
          </button>
          <button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>
          {mode === 'signup' && (
            <label>
              Confirm Password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <button type="button" className="login-guest" onClick={() => navigate('/')}>
          Continue as Guest ›
        </button>
      </div>
    </main>
  )
}