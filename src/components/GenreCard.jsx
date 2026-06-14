import { useState } from 'react'
import PartSection from './PartSection'
import { accentFromColor } from '../utils/accentColor'

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
