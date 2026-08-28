import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GENERATOR_GENRES, generateStarter, playStarter, exportStarterMidi } from '../audio/generator'
import { stopAllPlayback } from '../audio/usePlayer'
import { getContext } from '../audio/synth'
import { loadDrumKit } from '../audio/drumKit'
import { useSeo } from '../utils/useSeo'

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function GeneratePage() {
  const navigate = useNavigate()
  useSeo('Track Starter Generator — LoopLab', 'Generate a genre-accurate chord progression, bassline and drum pattern, audition it, and export as MIDI. Free.')

  const [genreId, setGenreId] = useState(GENERATOR_GENRES[0].id)
  const [keyRoot, setKeyRoot] = useState(GENERATOR_GENRES[0].keyRoots[0])
  const [mood, setMood] = useState(null)
  const [out, setOut] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  const transportRef = useRef(null)

  const genre = GENERATOR_GENRES.find(g => g.id === genreId)

  const stop = useCallback(() => {
    if (transportRef.current) { transportRef.current.stop(); transportRef.current = null }
    setPlaying(false); setStep(-1)
  }, [])

  const generate = useCallback((opts = {}) => {
    stop()
    const next = generateStarter({ genreId, keyRoot, mood, seed: opts.seed })
    setOut(next)
  }, [genreId, keyRoot, mood, stop])

  // Generate whenever the inputs change.
  useEffect(() => { generate() }, [generate])
  // Stop audio when leaving the page.
  useEffect(() => () => stop(), [stop])
  // Preload the sampled drum kit so audition plays real drums (decodes on a
  // suspended context — no user gesture needed; playback resumes on Audition).
  useEffect(() => { loadDrumKit(getContext()) }, [])

  function play() {
    if (!out) return
    stopAllPlayback() // don't overlap with any other playback on the site
    transportRef.current = playStarter(out, { onStep: s => setStep(s) })
    setPlaying(true)
  }

  function onGenreChange(id) {
    const g = GENERATOR_GENRES.find(x => x.id === id)
    setGenreId(id)
    setMood(null)
    if (g && !g.keyRoots.includes(keyRoot)) setKeyRoot(g.keyRoots[0])
  }

  const bars = out?.bars || 4
  const curBar = step >= 0 ? Math.floor(step / 16) % bars : -1

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Nav */}
        <nav className="flex items-center justify-between py-5 border-b border-hairline">
          <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity duration-150">
            <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-7 w-auto" />
          </button>
          <button onClick={() => navigate('/')} className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint hover:text-acid transition-colors duration-150">← Back</button>
        </nav>

        {/* Header */}
        <div className="py-8 sm:py-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-1.5 bg-acid" />
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-dim">Track Starter</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-tight leading-[0.9] mb-3">Generate a starter</h1>
          <p className="text-dim text-sm max-w-lg leading-relaxed">Pick a genre, key and mood — get a genre-accurate chord progression, bassline and drum pattern. Audition it, then export as MIDI for FL Studio.</p>
        </div>

        {/* Controls */}
        <div className="space-y-6 mb-8">
          {/* Genre */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint mb-2">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENERATOR_GENRES.map(g => (
                <button key={g.id} onClick={() => onGenreChange(g.id)}
                  className={`font-mono text-[12px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors duration-150 ${genreId === g.id ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink hover:border-dim'}`}
                >{g.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Key */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint mb-2">Key (minor)</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_KEYS.map(k => (
                  <button key={k} onClick={() => setKeyRoot(k)}
                    className={`font-mono text-[12px] px-3 py-1.5 border transition-colors duration-150 ${keyRoot === k ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink'}`}
                  >{k}</button>
                ))}
              </div>
            </div>
            {/* Mood */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint mb-2">Mood</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setMood(null)}
                  className={`font-mono text-[12px] uppercase px-3 py-1.5 border transition-colors duration-150 ${!mood ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink'}`}>Any</button>
                {(genre?.moods || []).map(m => (
                  <button key={m} onClick={() => setMood(m)}
                    className={`font-mono text-[12px] uppercase px-3 py-1.5 border transition-colors duration-150 ${mood === m ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink'}`}
                  >{m}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {out && (
          <div className="border border-hairline bg-surface p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">{out.keyLabel} · {out.bpm} BPM{out.mood ? ` · ${out.mood}` : ''}</span>
              <button onClick={() => generate({ seed: (out.seed + 1) >>> 0 })} className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150">↻ Regenerate</button>
            </div>

            {/* Progression */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {out.progression.map((sym, i) => (
                <div key={i} className={`text-center py-6 border transition-colors duration-150 ${curBar === i ? 'border-acid bg-acid/10' : 'border-hairline bg-surface-2'}`}>
                  <div className="font-display text-xl sm:text-2xl tracking-tight text-ink">{sym}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-faint mt-1">Bar {i + 1}</div>
                </div>
              ))}
            </div>

            {/* Transport */}
            <div className="flex flex-wrap items-center gap-3">
              {playing ? (
                <button onClick={stop} className="flex items-center gap-2 font-display font-semibold uppercase tracking-wide text-sm bg-surface-2 border border-hairline text-ink px-5 py-3 transition-colors duration-150">■ Stop</button>
              ) : (
                <button onClick={play} className="flex items-center gap-2 font-display font-semibold uppercase tracking-wide text-sm bg-acid text-base px-5 py-3 hover:bg-acid-dim transition-colors duration-150">▶ Audition</button>
              )}
              <button onClick={() => exportStarterMidi(out)} className="flex items-center gap-2 font-display font-semibold uppercase tracking-wide text-sm border border-acid/50 text-acid px-5 py-3 hover:bg-acid hover:text-base transition-colors duration-150">↓ Download MIDI</button>
            </div>
          </div>
        )}

        <p className="text-faint text-[11px] leading-relaxed pb-16 max-w-xl">
          Version one gives you a 4-bar chord / bass / drum bed — a starting point, not a finished track. Drop the MIDI into FL Studio and build from there. More genres and a lead line are coming.
        </p>
      </div>
    </div>
  )
}
