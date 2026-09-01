import { Link, useNavigate } from 'react-router-dom'
import GameCard from '../components/GameCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { GUEST_KEY } from '../components/RequireEntry.jsx'

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    localStorage.removeItem(GUEST_KEY)
    navigate('/login')
  }

  return (
    <main className="arcade-floor">
      <div className="arcade-account-bar">
        {loading ? (
          <span className="arcade-account-loading">Checking session…</span>
        ) : user ? (
          <>
            <span>Hi, {profile?.username ?? '…'}</span>
            <button className="arcade-account-btn" onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <span className="arcade-guest-label">Playing as Guest</span>
            <Link to="/login" className="arcade-account-btn">
              Log In / Sign Up
            </Link>
          </>
        )}
      </div>

      <header className="arcade-header">
        <p className="arcade-eyebrow">Now Open</p>
        <h1 className="arcade-title">Game Hub</h1>
        <p className="arcade-subtitle">Pick a cabinet. Insert token to play.</p>
      </header>

      <div className="cabinet-row">
        <GameCard
          title="2048"
          genre="Puzzle"
          mode="Single Player"
          status="Ready"
          accent="#ff6b5b"
          ready={true}
          to="/games/2048"
        />
        <GameCard
          title="Ante Up"
          genre="Card Game"
          mode="Single Player"
          status="Ready"
          accent="#2fd9c4"
          ready={true}
          to="/games/anteup"
        />
        <GameCard
          title="Spider Solitaire"
          genre="Solitaire"
          mode="Single Player"
          status="Ready"
          accent="#b09bef"
          ready={true}
          to="/games/spider"
        />
      </div>
    </main>
  )
}