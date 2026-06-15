import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import { accentFromColor } from '../utils/accentColor'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() =>
    genres.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-10">

        {/* Top bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="LoopLab"
              width={32}
              height={32}
              className="h-8 w-8 rounded"
            />
            <span className="font-bold text-white tracking-tight">LoopLab</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-600 ml-1 hidden sm:inline">FL Studio Reference</span>
          </div>
          <button
            onClick={() => navigate('/suggest')}
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Suggest improvement →
          </button>
        </header>

        {/* Tool nav */}
        <nav className="flex flex-wrap gap-x-8 gap-y-2 mb-10 pb-6 border-b border-white/[0.06]">
          {[
            { label: 'Tips & Shortcuts', path: '/tips' },
            { label: 'Production Tools', path: '/tools' },
            { label: 'Player', path: '/player' },
            { label: 'DJ Deck', path: '/dj' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Section header + search */}
        <div className="flex items-center gap-4 mb-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 shrink-0">Genre Reference</p>
          <div className="relative max-w-xs w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              placeholder="filter genres..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d1117] border border-white/[0.08] rounded pl-9 pr-3 py-1.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-[#7c5cfc]/50 transition"
            />
          </div>
        </div>

        {/* Genre grid — gap-px gives 1px grid lines via background bleed */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/[0.04]">
          {filtered.length > 0 ? (
            filtered.map(genre => {
              const accent = accentFromColor(genre.color)
              return (
                <button
                  key={genre.id}
                  onClick={() => navigate(`/genre/${genre.id}`)}
                  className="text-left bg-[#080c10] hover:bg-[#0d1117] transition-colors duration-150 p-4 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-sm font-semibold text-white leading-tight">{genre.name}</h2>
                    <span className="text-base opacity-25 shrink-0 group-hover:opacity-50 transition-opacity">{genre.emoji}</span>
                  </div>
                  <p className="font-mono text-[11px] mb-2" style={{ color: accent }}>{genre.bpm} BPM</p>
                  <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-400 transition-colors">{genre.description}</p>
                </button>
              )
            })
          ) : (
            <div className="col-span-full text-center py-16 text-gray-700 text-sm bg-[#080c10]">
              No genres match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        <footer className="flex items-center gap-3 mt-12 pt-6 border-t border-white/[0.04]">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] rounded opacity-30"
          />
          <p className="text-[11px] text-gray-700">LoopLab — FL Studio production reference</p>
        </footer>

      </div>
    </div>
  )
}
