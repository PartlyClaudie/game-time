import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import RequireEntry from './components/RequireEntry.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Game2048 from './games/2048/Game2048.jsx'
import AnteUp from './games/anteup/AnteUp.jsx'
import Spider from './games/spider/Spider.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireEntry>
              <Home />
            </RequireEntry>
          }
        />
        <Route
          path="/games/2048"
          element={
            <RequireEntry>
              <Game2048 />
            </RequireEntry>
          }
        />
        <Route
          path="/games/anteup"
          element={
            <RequireEntry>
              <AnteUp />
            </RequireEntry>
          }
        />
        <Route
          path="/games/spider"
          element={
            <RequireEntry>
              <Spider />
            </RequireEntry>
          }
        />
      </Routes>
    </AuthProvider>
  )
}