import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import { accentFromColor } from '../utils/accentColor'
import { useSeo } from '../utils/useSeo'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useSeo()

  const filtered = useMemo(() =>
    genres.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    ), [search])

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Nav */}
        <nav className="flex items-center justify-between py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoopLab" width={28} height={28} className="h-7 w-7 rounded-md" />
            <span className="font-semibold text-white text-sm tracking-tight">LoopLab</span>
          </div>
          <div className="flex items-center gap-6">
            {[['Tips', '/tips'], ['Tools', '/tools'], ['Player', '/player'], ['DJ Deck', '/dj']].map(([l, p]) => (
              <button key={p} onClick={() => navigate(p)} className="text-[13px] text-gray-300 hover:text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition-all hidden sm:block">{l}</button>
            ))}
            <button onClick={() => navigate('/suggest')} className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">Suggest →</button>
          </div>
        </nav>

        {/* Hero */}
        <div className="py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc]" />
            <span className="text-[11px] text-gray-400 tracking-wide">FL Studio Production Reference</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Genre Library</h1>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto mb-8">
            Pick a genre for a full breakdown — BPM, key, patterns, arrangement and more.
          </p>
          {/* Search */}
          <div className="relative max-w-sm mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search genres..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#1e1e2a] transition"
            />
          </div>
        </div>

        {/* Tool links */}
        <div className="flex flex-wrap gap-2 mb-8 sm:hidden">
          {[['Tips & Shortcuts', '/tips'], ['Production Tools', '/tools'], ['Player', '/player'], ['DJ Deck', '/dj']].map(([l, p]) => (
            <button key={p} onClick={() => navigate(p)} className="text-[12px] text-gray-300 border border-white/[0.12] rounded-full px-3 py-1.5 hover:border-white/30 hover:text-white transition">{l}</button>
          ))}
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-16">
          {filtered.length > 0 ? (
            filtered.map(genre => {
              const accent = accentFromColor(genre.color)
              return (
                <button
                  key={genre.id}
                  onClick={() => navigate(`/genre/${genre.id}`)}
                  className="text-left bg-[#16161e] hover:bg-[#1c1c28] border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-4 transition-all duration-150 group"
                  style={{ '--accent': accent }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md"
                      style={{ color: accent, background: `${accent}18` }}
                    >
                      {genre.bpm} BPM
                    </span>
                    <span className="text-lg opacity-40 group-hover:opacity-70 transition-opacity">{genre.emoji}</span>
                  </div>
                  <h2 className="text-[13px] font-semibold text-white mb-1.5 leading-snug">{genre.name}</h2>
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-500 transition-colors">{genre.description}</p>
                </button>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 text-gray-700">
              No genres match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        <footer className="flex items-center justify-center gap-2.5 pb-8 border-t border-white/[0.04] pt-6">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={16} height={16} className="h-4 w-4 rounded opacity-25" />
          <p className="text-[11px] text-gray-700">LoopLab — FL Studio production reference</p>
        </footer>

      </div>
    </div>
  )
}
