import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GenrePage from './pages/GenrePage'
import TipsPage from './pages/TipsPage'
import ToolsPage from './pages/ToolsPage'
import { stopAllPlayback } from './audio/usePlayer'

export default function App() {
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
    </Routes>
  )
}
