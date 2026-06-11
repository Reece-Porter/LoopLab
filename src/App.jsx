import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GenrePage from './pages/GenrePage'
import TipsPage from './pages/TipsPage'
import ToolsPage from './pages/ToolsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/genre/:id" element={<GenrePage />} />
      <Route path="/tips" element={<TipsPage />} />
      <Route path="/tools" element={<ToolsPage />} />
    </Routes>
  )
}
