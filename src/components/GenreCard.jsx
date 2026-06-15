import { useState } from 'react'
import PartSection from './PartSection'
import { accentFromColor } from '../utils/accentColor'

export default function GenreCard({ genre }) {
  const [open, setOpen] = useState(false)
  const accent = accentFromColor(genre.color)

  return (
    <div
      className="bg-[#0d1117] border border-white/[0.06] rounded hover:border-white/[0.12] transition-colors duration-150"
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold text-white truncate">{genre.name}</h2>
            <span className="font-mono text-[11px] shrink-0" style={{ color: accent }}>{genre.bpm} BPM</span>
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2">{genre.description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-300 shrink-0 mt-0.5 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
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
    <span className="text-[11px] text-gray-400 bg-white/[0.06] px-2.5 py-1 rounded font-mono">
      <span className="text-gray-600 mr-1">{label}:</span>{value}
    </span>
  )
}
