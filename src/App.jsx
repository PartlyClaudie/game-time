import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Game2048 from './games/2048/Game2048.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/2048" element={<Game2048 />} />
      </Routes>
    </AuthProvider>
  )
}