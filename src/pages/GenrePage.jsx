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
import { useSeo } from '../utils/useSeo'

export default function GenrePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const genre = genres.find(g => g.id === id)
  const [activePart, setActivePart] = useState(null)
  const [bpm, setBpm] = useState(() => (genre ? parseBpm(genre.bpm) : 120))
  const [selectedSong, setSelectedSong] = useState(null)
  const [savedVocalClips, setSavedVocalClips] = useState([])

  useSeo(
    genre ? `${genre.name} in FL Studio — ${genre.bpm} BPM Breakdown | LoopLab` : 'Genre — LoopLab',
    genre ? `How to make ${genre.name} in FL Studio: typical ${genre.bpm} BPM, key ${genre.key}, drum patterns, bassline, arrangement template and MIDI export. ${genre.description}` : undefined
  )

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
      <div className="min-h-screen bg-base flex items-center justify-center text-ink">
        <div className="text-center">
          <p className="font-display text-3xl uppercase tracking-wide mb-3">Genre not found</p>
          <button onClick={() => navigate('/')} className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid hover:text-ink transition-colors duration-150">← Back home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-base/90 border-b border-hairline">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="shrink-0 hover:opacity-70 transition-opacity duration-150" aria-label="Home">
              <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-5 w-auto" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Genres</span>
            </button>
            <span className="opacity-40 text-sm shrink-0 grayscale">{genre.emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-base uppercase tracking-[0.04em] font-semibold text-ink truncate leading-none">{genre.name}</h1>
              <span className="text-[11px] text-faint font-mono hidden sm:inline">{genre.bpm} BPM · {genre.key}</span>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint mb-0.5">Tempo</div>
              <div className="text-sm font-bold font-mono text-acid leading-none">{bpm}<span className="text-[9px] text-faint ml-0.5">BPM</span></div>
            </div>
          </div>
          <div data-tutorial="bpm-slider" className="flex items-center gap-3 mt-2.5">
            <input type="range" min={60} max={250} value={bpm} onChange={e => setBpm(Number(e.target.value))}
              className="flex-1 accent-acid cursor-pointer" aria-label="Tempo in BPM" />
            <button onClick={() => setBpm(parseBpm(genre.bpm))} className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150 shrink-0">reset</button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <p className="text-dim mb-8 max-w-3xl text-[14px] leading-relaxed">{genre.description}</p>

        {/* Part selector */}
        <p className="font-mono text-[10px] text-dim uppercase tracking-[0.2em] mb-3">Select a track element</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 mb-8">
          {genre.parts.map(part => (
            <button
              key={part.name}
              onClick={() => setActivePart(activePart?.name === part.name ? null : part)}
              className={`border p-3 sm:p-4 text-left transition-colors duration-150 ${
                activePart?.name === part.name
                  ? 'bg-acid border-acid text-base'
                  : 'border-hairline bg-surface hover:bg-elevate hover:border-dim'
              }`}
            >
              <div className={`text-xl sm:text-2xl mb-1.5 sm:mb-2 ${activePart?.name === part.name ? '' : 'grayscale opacity-70'}`}>{part.icon}</div>
              <div className={`font-display text-xs sm:text-sm uppercase tracking-wide font-medium ${activePart?.name === part.name ? 'text-base' : 'text-ink'}`}>{part.name}</div>
              <div className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wide mt-0.5 ${activePart?.name === part.name ? 'text-base/70' : 'text-faint'}`}>{part.patterns.length} pattern{part.patterns.length !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>

        {/* Part detail panel */}
        {activePart ? (
          <PartPanel part={activePart} accentClass={genre.color} bpm={bpm} />
        ) : (
          <div className="text-center py-16 text-faint font-mono text-xs uppercase tracking-[0.14em] border border-hairline">
            Pick an element above to see tips, example patterns and hear them play
          </div>
        )}

        {/* Arrangement View */}
        <div className="mt-12">
          <p className="font-mono text-[10px] text-dim uppercase tracking-[0.2em] mb-1">Full Arrangement</p>
          {songs.length > 0 && (
            <div className="flex gap-2 mb-4 mt-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => chooseSong(null)}
                className={`shrink-0 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-150 ${
                  !selectedSong
                    ? 'bg-acid text-base'
                    : 'bg-surface border border-hairline text-dim hover:text-ink hover:bg-elevate'
                }`}
              >
                Genre template
              </button>
              {songs.map(song => (
                <button
                  key={song.title}
                  onClick={() => chooseSong(song)}
                  className={`shrink-0 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] transition-colors duration-150 whitespace-nowrap ${
                    selectedSong?.title === song.title
                      ? 'bg-acid text-base'
                      : 'bg-surface border border-hairline text-dim hover:text-ink hover:bg-elevate'
                  }`}
                >
                  {song.artist} — {song.title}
                  <span className="opacity-60 hidden sm:inline"> ({song.year} · {song.bpm} BPM · {song.key})</span>
                  <span className="opacity-60 sm:hidden"> {song.bpm}</span>
                  <span className="ml-1.5 text-[9px] tracking-wide opacity-60">WIP</span>
                </button>
              ))}
            </div>
          )}
          {selectedSong && (
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim mb-3 flex items-center gap-1.5">
              <span className="text-acid">⚠</span>
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
          <p className="font-mono text-[10px] text-dim uppercase tracking-[0.2em] mb-3">Build Your Own Arrangement</p>
          <CustomArrangement parts={genre.parts} genreId={genre.id} accentClass={genre.color} bpm={bpm} savedVocalClips={savedVocalClips} />
          <div data-tutorial="vocal-recorder"><VocalRecorder onClipsChange={setSavedVocalClips} /></div>
        </div>
      </div>
      <GenreTutorial />
    </div>
  )
}
