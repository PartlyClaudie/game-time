import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'

// As each game is built, its route gets added here, e.g.:
// import Game2048 from './games/2048/Game2048.jsx'
// <Route path="/games/2048" element={<Game2048 />} />

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
