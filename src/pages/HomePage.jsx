import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import { accentFromColor } from '../utils/accentColor'
import { useSeo } from '../utils/useSeo'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user, displayName } = useAuth()

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
          <div className="flex items-center gap-2 sm:gap-3">
            {[['Community', '/community'], ['Tips', '/tips'], ['Tools', '/tools'], ['Player', '/player'], ['DJ Deck', '/dj']].map(([l, p]) => (
              <button key={p} onClick={() => navigate(p)} className="text-[13px] text-gray-300 hover:text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition-all hidden sm:block">{l}</button>
            ))}
            {user ? (
              <button onClick={() => navigate('/community')} className="text-[13px] text-white bg-[#7c5cfc]/15 border border-[#7c5cfc]/50 hover:bg-[#7c5cfc]/25 rounded-lg px-3 py-1.5 transition" title="Your account">{displayName}</button>
            ) : (
              <button onClick={() => navigate('/login')} className="text-[13px] text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition">Sign in</button>
            )}
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

        <footer className="flex flex-col items-center gap-4 pb-8 border-t border-white/[0.04] pt-6">
          {/* Social links */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/looplablive"
              target="_blank"
              rel="noreferrer"
              aria-label="LoopLab on Instagram"
              className="flex items-center gap-1.5 text-gray-500 hover:text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.82.92 1.4.17.43.37 1.04.42 2.23.06 1.27.07 1.65.07 4.86s0 3.6-.07 4.86c-.05 1.2-.25 1.8-.42 2.23-.22.58-.49.98-.92 1.4-.42.42-.82.68-1.4.9-.43.17-1.04.37-2.23.42-1.27.06-1.65.07-4.86.07s-3.6 0-4.86-.07c-1.2-.05-1.8-.25-2.23-.42a3.9 3.9 0 0 1-1.4-.9c-.42-.42-.68-.82-.9-1.4-.17-.43-.37-1.04-.42-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.86c.05-1.2.25-1.8.42-2.23.22-.58.48-.98.9-1.4.42-.42.82-.68 1.4-.9.43-.17 1.04-.37 2.23-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.2-1.7.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.28.8-.32 1.7C3.2 8.5 3.2 8.85 3.2 12s0 3.5.07 4.74c.04.9.2 1.38.32 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.28 1.7.32 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.2 1.7-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.28-.8.32-1.7.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.04-.9-.2-1.38-.32-1.7a2.9 2.9 0 0 0-.69-1.06 2.9 2.9 0 0 0-1.06-.69c-.32-.12-.8-.28-1.7-.32C15.5 4 15.15 4 12 4zm0 3.06A4.94 4.94 0 1 0 12 17a4.94 4.94 0 0 0 0-9.88zm0 8.14A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4zm6.3-8.35a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z" />
              </svg>
              <span className="text-[12px]">Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/@looplablive"
              target="_blank"
              rel="noreferrer"
              aria-label="LoopLab on TikTok"
              className="flex items-center gap-1.5 text-gray-500 hover:text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.86a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.3a5.86 5.86 0 0 0-.77-.05A5.89 5.89 0 1 0 15.64 16V9.4a7.5 7.5 0 0 0 4.36 1.4V7.6a4.28 4.28 0 0 1-3.4-1.78z" />
              </svg>
              <span className="text-[12px]">TikTok</span>
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={16} height={16} className="h-4 w-4 rounded opacity-25" />
            <p className="text-[11px] text-gray-700">LoopLab — FL Studio production reference</p>
          </div>
        </footer>

      </div>
    </div>
  )
}
