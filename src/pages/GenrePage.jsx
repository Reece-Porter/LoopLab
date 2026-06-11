import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import PartPanel from '../components/PartPanel'

export default function GenrePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const genre = genres.find(g => g.id === id)
  const [activePart, setActivePart] = useState(null)

  if (!genre) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-4xl mb-4">🎵</p>
          <p className="text-gray-400">Genre not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-purple-400 hover:text-purple-300">← Back home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All genres
        </button>

        <div className="flex items-center gap-5 mb-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${genre.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
            {genre.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">{genre.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">🎚 {genre.bpm} BPM</span>
              <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">🎵 {genre.key}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-400 mb-8 max-w-2xl">{genre.description}</p>

        {/* Part selector */}
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Select a track element</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {genre.parts.map(part => (
            <button
              key={part.name}
              onClick={() => setActivePart(activePart?.name === part.name ? null : part)}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                activePart?.name === part.name
                  ? `bg-gradient-to-br ${genre.color} border-transparent shadow-lg`
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl mb-2">{part.icon}</div>
              <div className={`text-sm font-semibold ${activePart?.name === part.name ? 'text-white' : 'text-gray-300'}`}>{part.name}</div>
              <div className="text-xs text-white/60 mt-0.5">{part.patterns.length} pattern{part.patterns.length !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>

        {/* Part detail panel */}
        {activePart && (
          <PartPanel part={activePart} accentClass={genre.color} />
        )}

        {!activePart && (
          <div className="text-center py-12 text-gray-700 border border-white/5 rounded-2xl">
            <span className="text-3xl block mb-2">👆</span>
            Pick an element above to see tips and patterns
          </div>
        )}
      </div>
    </div>
  )
}
