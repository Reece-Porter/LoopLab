import { useState } from 'react'
import PartSection from './PartSection'
import { accentFromColor } from '../utils/accentColor'

export default function GenreCard({ genre }) {
  const [open, setOpen] = useState(false)
  const accent = accentFromColor(genre.color)

  return (
    <div className="bg-[#101012] border border-hairline  overflow-hidden hover:border-hairline transition-colors duration-150">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-[13px] font-semibold text-white truncate">{genre.name}</h2>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
              style={{ color: accent, background: `${accent}18` }}
            >
              {genre.bpm}
            </span>
          </div>
          <p className="text-[11px] text-faint leading-relaxed line-clamp-2">{genre.description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-faint transition-transform duration-300 shrink-0 mt-0.5 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-hairline px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <InfoPill label="BPM" value={genre.bpm} accent={accent} />
            <InfoPill label="Key" value={genre.key} accent={accent} />
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

function InfoPill({ label, value, accent }) {
  return (
    <span className="text-[11px] font-mono px-2.5 py-1 " style={{ color: accent, background: `${accent}15` }}>
      <span className="opacity-50 mr-1">{label}:</span>{value}
    </span>
  )
}
