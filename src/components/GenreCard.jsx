import { useState } from 'react'
import PartSection from './PartSection'

export default function GenreCard({ genre }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur shadow-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-6 flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center text-2xl shrink-0 shadow-md`}>
          {genre.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white mb-1">{genre.name}</h2>
          <p className="text-sm text-gray-400 line-clamp-2">{genre.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
          <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">{genre.bpm} BPM</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-6 pb-6 pt-4">
          <div className="flex flex-wrap gap-3 mb-6">
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
