export default function GameCard({ title, genre, mode, status, accent, ready }) {
  return (
    <div className="cabinet" style={{ '--accent': accent }}>
      <div className="cabinet-marquee">{title}</div>
      <div className="cabinet-screen">
        <span className="cabinet-genre">{genre}</span>
        <span className="cabinet-mode">{mode}</span>
      </div>
      <div className="cabinet-footer">
        <span className="cabinet-status">{status}</span>
        <button className="cabinet-button" disabled={!ready}>
          {ready ? 'Insert Token ▸' : 'Locked'}
        </button>
      </div>
    </div>
  )
}
