import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import genres from '../data/genres.json'
import { GENRE_SONGS } from '../data/songs'
import { parseBpm } from '../audio/theory'
import PartPanel from '../components/PartPanel'
import ArrangementView from '../components/ArrangementView'
import CustomArrangement from '../components/CustomArrangement'
import VocalRecorder from '../components/VocalRecorder'
import GenreTutorial from '../components/GenreTutorial'

export default function GenrePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const genre = genres.find(g => g.id === id)
  const [activePart, setActivePart] = useState(null)
  const [bpm, setBpm] = useState(() => (genre ? parseBpm(genre.bpm) : 120))
  const [selectedSong, setSelectedSong] = useState(null)
  const [savedVocalClips, setSavedVocalClips] = useState([])

  const songs = (genre && GENRE_SONGS[genre.id]) || []

  // Merge a reference song's track sections + instrument labels into the
  // genre's arrangement. Songs that define a full custom `arrangement`
  // (their own sections AND tracks) use it wholesale instead.
  const activeArrangement = useMemo(() => {
    if (!genre || !selectedSong) return genre?.arrangement
    if (selectedSong.arrangement) return selectedSong.arrangement
    return {
      ...genre.arrangement,
      tracks: genre.arrangement.tracks.map(t => {
        const override = selectedSong.tracks.find(s => s.name === t.name)
        return override ? { ...t, sections: override.sections, instrument: override.instrument } : t
      }),
    }
  }, [genre, selectedSong])

  // Selecting a song snaps the tempo to that song's real BPM; deselecting
  // returns to the genre's typical tempo.
  const chooseSong = song => {
    const next = song && selectedSong?.title !== song.title ? song : null
    setSelectedSong(next)
    setBpm(next?.bpm || parseBpm(genre.bpm))
  }

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
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-[#0f0f13]/90 border-b border-white/[0.06]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Home">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoopLab" width={28} height={28} className="h-7 w-7 rounded-md" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[12px] text-gray-600 hover:text-gray-300 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Genres</span>
            </button>
            <span className="opacity-50 text-sm shrink-0">{genre.emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-white truncate">{genre.name}</h1>
              <span className="text-[11px] text-gray-600 font-mono hidden sm:inline">{genre.bpm} BPM · {genre.key}</span>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-0.5">Tempo</div>
              <div className="text-sm font-bold font-mono text-white leading-none">{bpm}<span className="text-[9px] text-gray-600 ml-0.5">BPM</span></div>
            </div>
          </div>
          <div data-tutorial="bpm-slider" className="flex items-center gap-2 mt-2">
            <input type="range" min={60} max={250} value={bpm} onChange={e => setBpm(Number(e.target.value))}
              className="flex-1 accent-[#7c5cfc] cursor-pointer" aria-label="Tempo in BPM" />
            <button onClick={() => setBpm(parseBpm(genre.bpm))} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors shrink-0">reset</button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <p className="text-gray-500 mb-8 max-w-3xl text-[14px] leading-relaxed">{genre.description}</p>

        {/* Part selector */}
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-3">Select a track element</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 mb-8">
          {genre.parts.map(part => (
            <button
              key={part.name}
              onClick={() => setActivePart(activePart?.name === part.name ? null : part)}
              className={`rounded-xl border p-3 sm:p-4 text-left transition-all duration-200 ${
                activePart?.name === part.name
                  ? `bg-gradient-to-br ${genre.color} border-transparent shadow-lg`
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1.5 sm:mb-2">{part.icon}</div>
              <div className={`text-xs sm:text-sm font-semibold ${activePart?.name === part.name ? 'text-white' : 'text-gray-300'}`}>{part.name}</div>
              <div className="text-[10px] sm:text-xs text-white/60 mt-0.5">{part.patterns.length} pattern{part.patterns.length !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>

        {/* Part detail panel */}
        {activePart ? (
          <PartPanel part={activePart} accentClass={genre.color} bpm={bpm} />
        ) : (
          <div className="text-center py-16 text-gray-700 border border-white/5 rounded-2xl">
            Pick an element above to see tips, example patterns and hear them play
          </div>
        )}

        {/* Arrangement View */}
        <div className="mt-12">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1">Full Arrangement</p>
          {songs.length > 0 && (
            <div className="flex gap-2 mb-4 mt-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => chooseSong(null)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !selectedSong
                    ? `bg-gradient-to-r ${genre.color} text-white shadow-lg`
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Genre template
              </button>
              {songs.map(song => (
                <button
                  key={song.title}
                  onClick={() => chooseSong(song)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSong?.title === song.title
                      ? `bg-gradient-to-r ${genre.color} text-white shadow-lg`
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {song.artist} — {song.title}
                  <span className="opacity-60 hidden sm:inline"> ({song.year} · {song.bpm} BPM · {song.key})</span>
                  <span className="opacity-60 sm:hidden"> {song.bpm}</span>
                  <span className="ml-1.5 text-[9px] font-medium uppercase tracking-wide opacity-60">WIP</span>
                </button>
              ))}
            </div>
          )}
          {selectedSong && (
            <p className="text-[11px] text-amber-500/70 mb-3 flex items-center gap-1.5">
              <span>⚠</span>
              <span>Song references are a work in progress — patterns are approximate and will be improved over time.</span>
            </p>
          )}
          <ArrangementView
            arrangement={activeArrangement}
            accentClass={genre.color}
            bpm={bpm}
            genreId={genre.id}
            parts={genre.parts}
            songGroove={selectedSong?.groove || null}
          />
        </div>

        {/* Custom arrangement builder */}
        <div data-tutorial="custom-section" className="mt-12">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-3">Build Your Own Arrangement</p>
          <CustomArrangement parts={genre.parts} genreId={genre.id} accentClass={genre.color} bpm={bpm} savedVocalClips={savedVocalClips} />
          <div data-tutorial="vocal-recorder"><VocalRecorder onClipsChange={setSavedVocalClips} /></div>
        </div>
      </div>
      <GenreTutorial />
    </div>
  )
}
