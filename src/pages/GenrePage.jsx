import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import { parseBpm } from '../audio/theory'
import PartPanel from '../components/PartPanel'
import ArrangementView from '../components/ArrangementView'

export default function GenrePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const genre = genres.find(g => g.id === id)
  const [activePart, setActivePart] = useState(null)
  const [bpm, setBpm] = useState(() => (genre ? parseBpm(genre.bpm) : 120))

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
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-gray-950/80 border-b border-white/10">
        <div className="w-full px-6 lg:px-10 py-4 flex items-center gap-5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All genres
          </button>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
            {genre.emoji}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-white truncate">{genre.name}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400">🎚 typical {genre.bpm} BPM</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">🎵 {genre.key}</span>
            </div>
          </div>

          {/* Live BPM control — drives both the example patterns and the arrangement */}
          <div className="ml-auto shrink-0 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Tempo</div>
              <div className="text-lg font-black font-mono text-white leading-none">{bpm}<span className="text-[10px] text-gray-500 ml-1">BPM</span></div>
            </div>
            <input
              type="range"
              min={60}
              max={250}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-32 sm:w-44 accent-purple-500 cursor-pointer"
              aria-label="Tempo in BPM"
            />
            <button
              onClick={() => setBpm(parseBpm(genre.bpm))}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              title="Reset to the genre's typical tempo"
            >
              reset
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 lg:px-10 py-8">
        <p className="text-gray-400 mb-8 max-w-3xl">{genre.description}</p>

        {/* Part selector */}
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Select a track element to build</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8">
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
        {activePart ? (
          <PartPanel part={activePart} accentClass={genre.color} bpm={bpm} />
        ) : (
          <div className="text-center py-16 text-gray-700 border border-white/5 rounded-2xl">
            <span className="text-4xl block mb-3">👆</span>
            Pick an element above to see tips, example patterns and hear them play
          </div>
        )}

        {/* Arrangement View */}
        <div className="mt-12">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Full Arrangement</p>
          <ArrangementView arrangement={genre.arrangement} accentClass={genre.color} bpm={bpm} genreId={genre.id} parts={genre.parts} />
        </div>
      </div>
    </div>
  )
}
