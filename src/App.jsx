import { useState, useMemo } from 'react'
import genres from './data/genres.json'
import GenreCard from './components/GenreCard'

export default function App() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    genres.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🎛️</span>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              LoopLab
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            FL Studio genre guides — break down the anatomy of any style and know exactly what to put in each track.
          </p>
        </header>

        <div className="relative mb-8">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search genres..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
        </div>

        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map(genre => <GenreCard key={genre.id} genre={genre} />)
          ) : (
            <div className="text-center py-16 text-gray-600">
              <span className="text-4xl block mb-3">🔍</span>
              No genres match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        <footer className="text-center mt-16 text-xs text-gray-700">
          LoopLab — FL Studio production reference
        </footer>
      </div>
    </div>
  )
}
