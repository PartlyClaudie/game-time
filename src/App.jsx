import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import RequireEntry from './components/RequireEntry.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Game2048 from './games/2048/Game2048.jsx'

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
      </Routes>
    </AuthProvider>
  )
}