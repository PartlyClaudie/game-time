import GameCard from '../components/GameCard.jsx'

export default function Home() {
  return (
    <main className="arcade-floor">
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
          title="Tic-Tac-Toe"
          genre="Strategy"
          mode="Multiplayer"
          status="Coming in Step 3"
          accent="#2fd9c4"
          ready={false}
        />
      </div>
    </main>
  )
}