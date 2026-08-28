// Track-starter generator: (genre, key, mood, seed) → a coherent, genre-flavoured
// chord progression + bassline + drum pattern. Reuses the existing theory,
// synth, clip and MIDI-export code — the only new logic is the composition layer.

import { grooveClip } from './arrangementClip'
import { exportClipsMidi } from './midiExport'
import { getContext, kick, hat, clap, bass, chordStab, supersawChord, rhodes, synthPad } from './synth'
import { noteToFreq, chordToFreqs } from './theory'
import { GENERATOR } from '../data/generator'
import { playKitVoice } from './drumKit'

const CHROMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const PC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }
const SCALE   = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11] }
// Diatonic chord qualities per degree, matching theory.js QUALITIES symbols.
const TRIAD   = { minor: ['m', 'dim', '', 'm', 'm', '', ''],        major: ['', 'm', 'm', '', '', 'm', 'dim'] }
const SEVENTH = { minor: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'], major: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'] }

// Deterministic PRNG so a given seed reproduces the same track (used by tests
// and the "regenerate" button, which just bumps the seed).
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function weightedPick(items, rnd) {
  const total = items.reduce((s, i) => s + (i.weight || 1), 0)
  let r = rnd() * total
  for (const it of items) { r -= (it.weight || 1); if (r <= 0) return it }
  return items[items.length - 1]
}
function stepsMask(positions, len = 16) {
  const a = new Array(len).fill(0)
  positions.forEach(p => { if (p < len) a[p] = 1 })
  return a
}

export const GENERATOR_GENRES = Object.keys(GENERATOR).map(id => ({ id, ...GENERATOR[id] }))

// ── Pure generation ──────────────────────────────────────────────────────────
export function generateStarter({ genreId, keyRoot, mode, mood, seed }) {
  const g = GENERATOR[genreId]
  if (!g) throw new Error(`Generator not available for "${genreId}"`)
  mode = mode || g.mode
  keyRoot = keyRoot || g.keyRoots[0]
  const usedSeed = (seed ?? Math.floor(Math.random() * 1e9)) >>> 0
  const rnd = mulberry32(usedSeed)

  const pool = mood ? g.progressions.filter(p => !p.moods || p.moods.includes(mood)) : g.progressions
  const chosen = weightedPick(pool.length ? pool : g.progressions, rnd)

  const scale = SCALE[mode] || SCALE.minor
  const qual = (g.quality === 'seventh' ? SEVENTH : TRIAD)[mode] || (g.quality === 'seventh' ? SEVENTH.minor : TRIAD.minor)
  const tonic = PC[keyRoot] ?? 9

  const progression = chosen.degrees.map(d => {
    const deg = ((d % 7) + 7) % 7
    const rootPc = (tonic + scale[deg]) % 12
    return CHROMA[rootPc] + qual[deg]
  })
  const bars = g.bars || progression.length

  const bassNotesPerBar = progression.map(sym => {
    const root = sym.match(/^[A-G]#?/)[0]
    return g.bass === 'octave' ? [`${root}1`, `${root}2`, `${root}1`, `${root}2`] : [`${root}1`]
  })

  return {
    genreId, label: g.label, bpm: g.bpm, bars,
    key: { root: keyRoot, mode },
    keyLabel: `${keyRoot} ${mode}`,
    mood: mood || null,
    seed: usedSeed,
    progression,
    chordSteps: g.chordSteps,
    bassSteps: g.bassSteps,
    bassNotesPerBar,
    chordTimbre: g.chordTimbre,
    drums: g.drums,
  }
}

// ── voices → per-bar clips (for MIDI export) ─────────────────────────────────
function starterToClips(out) {
  const { progression, chordSteps, bassSteps, bassNotesPerBar, drums, bars, chordTimbre } = out
  const pad = chordTimbre === 'pad'
  const useRhodes = chordTimbre === 'rhodes'
  const clips = {}
  clips.Chords = progression.map(sym => grooveClip('chord', { steps: stepsMask(chordSteps), chords: [sym], pad, rhodes: useRhodes }))
  clips.Bass = progression.map((_sym, bar) => grooveClip('bass', { steps: stepsMask(bassSteps), notes: bassNotesPerBar[bar], sub: true }))
  clips.Kick = Array.from({ length: bars }, () => grooveClip('kick', { steps: stepsMask(drums.Kick) }))
  clips.Hats = Array.from({ length: bars }, () => grooveClip('hat', { steps: stepsMask(drums.Hats), open: true }))
  clips.Clap = Array.from({ length: bars }, () => grooveClip('clap', { steps: stepsMask(drums.Clap) }))
  return clips
}

export function exportStarterMidi(out) {
  exportClipsMidi(starterToClips(out), out.bpm, ['Kick', 'Hats', 'Clap', 'Bass', 'Chords'])
}

// ── Audition ─────────────────────────────────────────────────────────────────
// A small dedicated scheduler (playGroove plays only a hardcoded default groove,
// so it can't audition generated data). Reuses the synth voices.
export function playStarter(out, { onStep } = {}) {
  const ctx = getContext()
  const busEl = ctx.createGain()
  busEl.gain.value = 0.85
  busEl.connect(ctx.destination)

  const { progression, chordSteps, bassSteps, bassNotesPerBar, drums, bars, chordTimbre, bpm } = out
  const total = bars * 16
  const stepDur = 60 / bpm / 4
  const kickSet = new Set(drums.Kick), hatSet = new Set(drums.Hats), clapSet = new Set(drums.Clap)
  const chordSet = new Set(chordSteps)
  const bassOrder = [...new Set(bassSteps)].sort((a, b) => a - b)
  const bassSet = new Set(bassSteps)
  const chordOct = 4

  let cur = 0
  let next = ctx.currentTime + 0.1
  let stopped = false
  let timer = null

  function tick() {
    if (stopped) return
    while (next < ctx.currentTime + 0.1) {
      const s = cur % total
      const bar = Math.floor(s / 16)
      const inBar = s % 16
      // Drums: use the sampled kit when loaded, else fall back to the synth.
      if (kickSet.has(inBar)) { if (!playKitVoice(ctx, 'kick', next, busEl, 0.95)) kick(ctx, next, busEl, 0.9, '909') }
      if (hatSet.has(inBar)) {
        const open = inBar % 4 === 2
        if (!playKitVoice(ctx, open ? 'hatOpen' : 'hatClosed', next, busEl, 0.45)) hat(ctx, next, busEl, 0.3, open)
      }
      if (clapSet.has(inBar)) { if (!playKitVoice(ctx, 'clap', next, busEl, 0.6)) clap(ctx, next, busEl, 0.5) }
      if (chordSet.has(inBar)) {
        const freqs = chordToFreqs(progression[bar % progression.length], chordOct)
        if (chordTimbre === 'rhodes') rhodes(ctx, next, busEl, freqs, 0.22, stepDur * 6)
        else if (chordTimbre === 'pad') synthPad(ctx, next, busEl, freqs, 0.18, stepDur * 10)
        else if (chordTimbre === 'supersaw') supersawChord(ctx, next, busEl, freqs, 0.13, stepDur * 3.2)
        else chordStab(ctx, next, busEl, freqs, 0.18, stepDur * 4, true)
      }
      if (bassSet.has(inBar)) {
        const notes = bassNotesPerBar[bar % bassNotesPerBar.length]
        const idx = bassOrder.indexOf(inBar)
        const name = notes[idx % notes.length]
        const f = noteToFreq(name)
        if (f) bass(ctx, next, busEl, f, 0.5, stepDur * 1.6)
      }
      if (onStep) {
        const ms = (next - ctx.currentTime) * 1000
        const step = s
        setTimeout(() => { if (!stopped) onStep(step) }, Math.max(0, ms))
      }
      next += stepDur
      cur++
    }
    timer = setTimeout(tick, 25)
  }
  tick()

  return {
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      try { busEl.disconnect() } catch { /* already gone */ }
      if (onStep) onStep(-1)
    },
  }
}
