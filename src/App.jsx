import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GenrePage from './pages/GenrePage'
import TipsPage from './pages/TipsPage'
import ToolsPage from './pages/ToolsPage'
import DJDeckPage from './pages/DJDeckPage'
import DJDecksPage from './pages/DJDecksPage'
import SuggestPage from './pages/SuggestPage'
import CommunityPage from './pages/CommunityPage'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import GeneratePage from './pages/GeneratePage'
import { stopAllPlayback } from './audio/usePlayer'

export default function App() {
  const location = useLocation()

  // Fire a GA4 page_view on every route change.
  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', { page_path: location.pathname + location.search })
  }, [location])

  // Spacebar stops any playback (anywhere on the site), unless you're typing.
  useEffect(() => {
    const onKey = e => {
      if (e.code !== 'Space' && e.key !== ' ') return
      const el = e.target
      const tag = el && el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return
      e.preventDefault()
      stopAllPlayback()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/genre/:id" element={<GenrePage />} />
      <Route path="/tips" element={<TipsPage />} />
      <Route path="/tools" element={<ToolsPage />} />
      <Route path="/player" element={<DJDeckPage />} />
      <Route path="/dj" element={<DJDecksPage />} />
      <Route path="/suggest" element={<SuggestPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/generate" element={<GeneratePage />} />
    </Routes>
  )
}
