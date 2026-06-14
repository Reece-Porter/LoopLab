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
          <div className="flex justify-end mb-2">
            <button
              onClick={() => navigate('/suggest')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 border border-white/10 hover:border-amber-400/40 rounded-lg px-3 py-1.5 transition"
            >
              Suggest an improvement
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            LoopLab
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">
            FL Studio Production Reference
          </p>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Genre guides — pick a style to get a full breakdown of every track element with example patterns.
          </p>
        </header>

        {/* Quick links to the reference areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => navigate('/tips')}
            className="text-left rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition p-4 flex items-center gap-3 group border-l-[3px] border-l-amber-500"
          >
            <span className="flex-1">
              <span className="block font-semibold text-white text-sm">FL Studio Tips &amp; Shortcuts</span>
              <span className="block text-xs text-gray-500 mt-0.5">Keyboard shortcuts and workflow tricks</span>
            </span>
            <span className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all text-sm">→</span>
          </button>
          <button
            onClick={() => navigate('/tools')}
            className="text-left rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition p-4 flex items-center gap-3 group border-l-[3px] border-l-emerald-500"
          >
            <span className="flex-1">
              <span className="block font-semibold text-white text-sm">Production Tools &amp; Resources</span>
              <span className="block text-xs text-gray-500 mt-0.5">Free samples, vocals, plugins and where to find tracks</span>
            </span>
            <span className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all text-sm">→</span>
          </button>
          <button
            onClick={() => navigate('/player')}
            className="text-left rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition p-4 flex items-center gap-3 group border-l-[3px] border-l-purple-500"
          >
            <span className="flex-1">
              <span className="block font-semibold text-white text-sm">Player &amp; Downloader</span>
              <span className="block text-xs text-gray-500 mt-0.5">Load or download a track and mix it with 3-band EQ</span>
            </span>
            <span className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all text-sm">→</span>
          </button>
          <button
            onClick={() => navigate('/dj')}
            className="text-left rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition p-4 flex items-center gap-3 group border-l-[3px] border-l-cyan-500"
          >
            <span className="flex-1">
              <span className="block font-semibold text-white text-sm">DJ Deck</span>
              <span className="block text-xs text-gray-500 mt-0.5">Two decks — mix &amp; beat-match two tracks together</span>
            </span>
            <span className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all text-sm">→</span>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.length > 0 ? (
            filtered.map(genre => (
              <button
                key={genre.id}
                onClick={() => navigate(`/genre/${genre.id}`)}
                className="text-left rounded-lg border border-white/[0.08] bg-[#0a0a0f] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 p-4 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{genre.emoji}</span>
                  <h2 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors truncate flex-1">{genre.name}</h2>
                </div>
                <p className="text-xs text-gray-500 mb-2">{genre.bpm} BPM</p>
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{genre.description}</p>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-600">
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
