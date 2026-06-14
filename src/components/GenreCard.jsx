import { useState } from 'react'
import PartSection from './PartSection'

export default function GenreCard({ genre }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-[#0a0a0f]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-base shrink-0">{genre.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-white">{genre.name}</h2>
            <span className="text-xs text-gray-500">{genre.bpm} BPM</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mt-0.5">{genre.description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}
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
    <span className="text-xs text-gray-300 bg-white/[0.08] px-3 py-1 rounded-full">
      <span className="text-gray-500 mr-1">{label}:</span>{value}
    </span>
  )
}
