import { useState } from 'react'
import PartSection from './PartSection'

// Map Tailwind gradient "from-X-N" to a CSS hex color for the left border accent.
function accentFromColor(colorClass) {
  if (!colorClass) return '#a855f7'
  const m = colorClass.match(/from-(\w+)-(\d+)/)
  if (!m) return '#a855f7'
  const palette = {
    purple:  { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
    pink:    { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
    red:     { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
    orange:  { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
    amber:   { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
    yellow:  { 400: '#facc15', 500: '#eab308', 600: '#ca8a04' },
    green:   { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
    emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
    teal:    { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
    cyan:    { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
    blue:    { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
    indigo:  { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
    violet:  { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
    rose:    { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
    fuchsia: { 400: '#e879f9', 500: '#d946ef', 600: '#c026d3' },
  }
  const name = m[1]
  const shade = parseInt(m[2], 10)
  return (palette[name] && palette[name][shade]) || '#a855f7'
}

export default function GenreCard({ genre }) {
  const [open, setOpen] = useState(false)
  const accent = accentFromColor(genre.color)

  return (
    <div
      className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{genre.emoji}</span>
            <h2 className="text-base font-semibold text-white truncate">{genre.name}</h2>
            <span className="text-xs text-gray-500 shrink-0">{genre.bpm} BPM</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{genre.description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 mt-0.5 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/[0.08] px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-3 mb-4">
            <InfoPill label="BPM" value={genre.bpm} />
            <InfoPill label="Key" value={genre.key} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {genre.parts.map(part => (
              <PartSection key={part.name} part={part} accentClass={genre.color} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <span className="text-xs text-gray-300 bg-white/10 px-3 py-1 rounded-full">
      <span className="text-gray-500 mr-1">{label}:</span>{value}
    </span>
  )
}
