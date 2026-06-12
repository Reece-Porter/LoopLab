import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() =>
    genres.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🎛️</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              LoopLab
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            FL Studio genre guides — pick a style to get a full breakdown of every track element with example patterns.
          </p>
        </header>

        {/* Quick links to the reference areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/tips')}
            className="text-left rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-600/10 hover:border-amber-400/40 transition p-5 flex items-center gap-4 group"
          >
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shrink-0">⌨️</span>
            <span className="flex-1">
              <span className="block font-bold text-white group-hover:text-amber-300 transition-colors">FL Studio Tips & Shortcuts</span>
              <span className="block text-xs text-gray-400 mt-0.5">Keyboard shortcuts and workflow tricks</span>
            </span>
            <span className="text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">→</span>
          </button>
          <button
            onClick={() => navigate('/tools')}
            className="text-left rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 hover:border-emerald-400/40 transition p-5 flex items-center gap-4 group"
          >
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shrink-0">🧰</span>
            <span className="flex-1">
              <span className="block font-bold text-white group-hover:text-emerald-300 transition-colors">Production Tools & Resources</span>
              <span className="block text-xs text-gray-400 mt-0.5">Free samples, vocals, plugins and where to find tracks</span>
            </span>
            <span className="text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">→</span>
          </button>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? (
            filtered.map(genre => (
              <button
                key={genre.id}
                onClick={() => navigate(`/genre/${genre.id}`)}
                className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 p-6 group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                    {genre.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{genre.name}</h2>
                    <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">{genre.bpm} BPM</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{genre.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {genre.parts.slice(0, 5).map(p => (
                    <span key={p.name} className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{p.icon} {p.name}</span>
                  ))}
                  {genre.parts.length > 5 && (
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">+{genre.parts.length - 5} more</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-600">
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
