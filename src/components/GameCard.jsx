import { Link } from 'react-router-dom'

export default function GameCard({ title, genre, mode, status, accent, ready, to }) {
  return (
    <div className="cabinet" style={{ '--accent': accent }}>
      <div className="cabinet-marquee">{title}</div>
      <div className="cabinet-screen">
        <span className="cabinet-genre">{genre}</span>
        <span className="cabinet-mode">{mode}</span>
      </div>
      <div className="cabinet-footer">
        <span className="cabinet-status">{status}</span>
        {ready ? (
          <Link to={to} className="cabinet-button">
            Insert Token ▸
          </Link>
        ) : (
          <button className="cabinet-button" disabled>
            Locked
          </button>
        )}
      </div>
    </div>
  )
}