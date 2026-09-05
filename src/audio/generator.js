// Track-starter generator: (genre, key, mood, seed) → a coherent, genre-flavoured
// chord progression + bassline + drum pattern. Reuses the existing theory,
// synth, clip and MIDI-export code — the only new logic is the composition layer.

import { grooveClip } from './arrangementClip'
import { exportClipsMidi } from './midiExport'
import { getContext, kick, hat, clap, bass, chordStab, supersawChord, rhodes, synthPad, riser, supersaw, vox as voxSynth } from './synth'
import { noteToFreq, chordToFreqs, chordToMidi } from './theory'
import { GENERATOR } from '../data/generator'
import { playKitVoice } from './drumKit'
import { playChordSampled, playFreqSampled, playRiser } from './sampler'

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

  const arrangement = g.arrangement || [{ name: 'Loop', bars, parts: ['kick', 'hats', 'clap', 'bass', 'chords'] }]

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
    arrangement,
    totalBars: arrangement.reduce((s, x) => s + x.bars, 0),
  }
}

// ── Arrangement helpers ──────────────────────────────────────────────────────
// Which section (and its active parts) covers a given global bar index.
function partsAt(arrangement, globalBar) {
  let acc = 0
  for (const sec of arrangement) {
    if (globalBar < acc + sec.bars) return { section: sec, localBar: globalBar - acc, parts: new Set(sec.parts) }
    acc += sec.bars
  }
  return { section: null, localBar: 0, parts: new Set() }
}

// MIDI number → note name (e.g. 60 → 'C4'), for building lead/vocal clips.
function midiToName(m) {
  return CHROMA[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)
}

// Lead line: an 8th-note arpeggio of the current chord's tones, up in octave 5.
// Even bars ascend, odd bars descend, so the lead answers itself across a
// two-bar phrase instead of repeating. Returns { steps, notes } for grooveClip.
function leadPhrase(sym, bar) {
  // Octave 4 keeps the arp within the sampled instruments' recorded range so it
  // stays in tune (they top out around MIDI 72) while still sitting above the pad.
  const midis = chordToMidi(sym, 4)
  if (!midis.length) return null
  const seq = bar % 2 === 0 ? midis : [...midis].reverse()
  const steps = [0, 2, 4, 6, 8, 10, 12, 14]
  return { steps, notes: steps.map((_, i) => midiToName(seq[i % seq.length])) }
}

// Vocal topline: the chord root and fifth up high, sparse and hook-like, phrasing
// over two bars. Returns { steps, notes } for grooveClip.
function vocalPhrase(sym, bar) {
  // Octave 4 keeps the topline inside the vocal multisample's recorded range.
  const midis = chordToMidi(sym, 4)
  if (!midis.length) return null
  const root = midiToName(midis[0])
  const fifth = midiToName(midis[Math.min(2, midis.length - 1)])
  return bar % 2 === 0
    ? { steps: [0, 8], notes: [root, fifth] }
    : { steps: [0, 6, 12], notes: [fifth, root, fifth] }
}

// Global bar indices where a 4-bar riser should begin (leading into a drop).
function riserStartBars(arrangement) {
  const starts = []
  let acc = 0
  arrangement.forEach(sec => { starts.push(acc); acc += sec.bars })
  const set = new Set()
  arrangement.forEach((sec, i) => {
    if (sec.riserEnd) set.add(starts[i] + Math.max(0, sec.bars - 4))
    if (sec.riserStart && i > 0) set.add(starts[i - 1] + Math.max(0, arrangement[i - 1].bars - 4))
  })
  return set
}

// ── Full arrangement → per-bar clips (for MIDI export) ───────────────────────
// One clip per bar per track across the whole song; null when a part is silent
// in that section. Fills add extra claps on the last bar of an 8-bar phrase.
function starterToClips(out) {
  const { progression, chordSteps, bassSteps, bassNotesPerBar, drums, chordTimbre, arrangement, totalBars } = out
  const pad = chordTimbre === 'pad'
  const useRhodes = chordTimbre === 'rhodes'
  const clips = { Kick: [], Hats: [], Clap: [], Bass: [], Chords: [], Pad: [], Lead: [], Vox: [] }
  for (let bar = 0; bar < totalBars; bar++) {
    const { parts, localBar } = partsAt(arrangement, bar)
    const sym = progression[bar % progression.length]
    const fill = localBar % 8 === 7
    clips.Kick.push(parts.has('kick') ? grooveClip('kick', { steps: stepsMask(drums.Kick) }) : null)
    clips.Hats.push(parts.has('hats') ? grooveClip('hat', { steps: stepsMask(drums.Hats), open: true }) : null)
    const clapSteps = parts.has('clap') ? (fill ? [...new Set([...drums.Clap, 8, 10, 12, 14])] : drums.Clap) : null
    clips.Clap.push(clapSteps ? grooveClip('clap', { steps: stepsMask(clapSteps) }) : null)
    clips.Bass.push(parts.has('bass') ? grooveClip('bass', { steps: stepsMask(bassSteps), notes: bassNotesPerBar[bar % bassNotesPerBar.length], sub: true }) : null)
    clips.Chords.push(parts.has('chords') ? grooveClip('chord', { steps: stepsMask(chordSteps), chords: [sym], pad, rhodes: useRhodes }) : null)
    clips.Pad.push(parts.has('pad') ? grooveClip('chord', { steps: stepsMask([0]), chords: [sym], pad: true }) : null)
    const lead = parts.has('lead') ? leadPhrase(sym, bar) : null
    clips.Lead.push(lead ? grooveClip('pluck', { steps: stepsMask(lead.steps), notes: lead.notes }) : null)
    const voc = parts.has('vox') ? vocalPhrase(sym, bar) : null
    clips.Vox.push(voc ? grooveClip('pluck', { steps: stepsMask(voc.steps), notes: voc.notes }) : null)
  }
  return clips
}

export function exportStarterMidi(out) {
  exportClipsMidi(starterToClips(out), out.bpm, ['Kick', 'Hats', 'Clap', 'Bass', 'Chords', 'Pad', 'Lead', 'Vox'])
}

// ── Audition ─────────────────────────────────────────────────────────────────
// A small dedicated scheduler (playGroove plays only a hardcoded default groove,
// so it can't audition generated data). Reuses the synth voices.
export function playStarter(out, { onStep } = {}) {
  const ctx = getContext()
  const busEl = ctx.createGain()
  busEl.gain.value = 0.85
  busEl.connect(ctx.destination)

  const { progression, chordSteps, bassSteps, bassNotesPerBar, drums, chordTimbre, bpm, arrangement, totalBars } = out
  const total = totalBars * 16
  const stepDur = 60 / bpm / 4
  const kickSet = new Set(drums.Kick), hatSet = new Set(drums.Hats), clapSet = new Set(drums.Clap)
  const chordSet = new Set(chordSteps)
  const bassOrder = [...new Set(bassSteps)].sort((a, b) => a - b)
  const bassSet = new Set(bassSteps)
  const chordOct = 4
  const risers = riserStartBars(arrangement)
  const chordInst = chordTimbre === 'rhodes' ? 'rhodes' : chordTimbre === 'supersaw' ? 'supersaw' : chordTimbre === 'pad' ? 'pad' : 'piano'
  const leadInst = chordTimbre === 'rhodes' ? 'rhodes' : 'ravelead'

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
      const { parts, localBar } = partsAt(arrangement, bar)
      const fill = localBar % 8 === 7

      // Riser into a drop (4 bars long, once at the section-relative start).
      if (inBar === 0 && risers.has(bar) && !playRiser(ctx, next, busEl, 0.5)) riser(ctx, next, busEl, 0.14, stepDur * 64)

      if (parts.has('kick') && kickSet.has(inBar)) { if (!playKitVoice(ctx, 'kick', next, busEl, 0.95)) kick(ctx, next, busEl, 0.9, '909') }
      if (parts.has('hats') && hatSet.has(inBar)) {
        const open = inBar % 4 === 2
        if (!playKitVoice(ctx, open ? 'hatOpen' : 'hatClosed', next, busEl, 0.45)) hat(ctx, next, busEl, 0.3, open)
      }
      if (parts.has('clap') && (clapSet.has(inBar) || (fill && (inBar === 8 || inBar === 10 || inBar === 12 || inBar === 14)))) {
        if (!playKitVoice(ctx, 'clap', next, busEl, 0.6)) clap(ctx, next, busEl, 0.5)
      }
      if (parts.has('chords') && chordSet.has(inBar)) {
        const freqs = chordToFreqs(progression[bar % progression.length], chordOct)
        if (!playChordSampled(ctx, chordInst, freqs, next, busEl, 0.5, stepDur * 5)) {
          if (chordTimbre === 'rhodes') rhodes(ctx, next, busEl, freqs, 0.22, stepDur * 6)
          else if (chordTimbre === 'supersaw') supersawChord(ctx, next, busEl, freqs, 0.13, stepDur * 3.2)
          else chordStab(ctx, next, busEl, freqs, 0.18, stepDur * 4, true)
        }
      }
      if (parts.has('pad') && inBar === 0) {
        const freqs = chordToFreqs(progression[bar % progression.length], chordOct)
        // Fold chord tones into the low-sampled string pad's range.
        const padFreqs = freqs.map(f => { let x = f; while (x > 210) x /= 2; return x })
        if (!playChordSampled(ctx, 'ravepad', padFreqs, next, busEl, 0.4, stepDur * 16)) synthPad(ctx, next, busEl, freqs, 0.16, stepDur * 16)
      }
      if (parts.has('bass') && bassSet.has(inBar)) {
        const notes = bassNotesPerBar[bar % bassNotesPerBar.length]
        const idx = bassOrder.indexOf(inBar)
        const name = notes[idx % notes.length]
        const f = noteToFreq(name)
        if (f && !playFreqSampled(ctx, 'bass', f, next, busEl, 0.55, stepDur * 1.6)) bass(ctx, next, busEl, f, 0.5, stepDur * 1.6)
      }
      // Lead — sampled synth arpeggio of the chord, with a synth fallback.
      if (parts.has('lead')) {
        const ph = leadPhrase(progression[bar % progression.length], bar)
        const i = ph ? ph.steps.indexOf(inBar) : -1
        if (i >= 0) {
          let f = noteToFreq(ph.notes[i])
          if (f && leadInst === 'ravelead') while (f > 500) f /= 2   // fold into the lead's sampled range
          if (f && !playFreqSampled(ctx, leadInst, f, next, busEl, 0.32, stepDur * 1.8)) supersaw(ctx, next, busEl, f, 0.2, stepDur * 1.8)
        }
      }
      // Vocal topline — the real sung multisample (Cymatics), pitched to the
      // note; falls back to the synth choir until the samples decode.
      if (parts.has('vox')) {
        const ph = vocalPhrase(progression[bar % progression.length], bar)
        const i = ph ? ph.steps.indexOf(inBar) : -1
        if (i >= 0) {
          const f = noteToFreq(ph.notes[i])
          if (f && !playFreqSampled(ctx, 'vocal', f, next, busEl, 0.5, stepDur * 6)) {
            voxSynth(ctx, next, busEl, f, 0.22, stepDur * 6)
          }
        }
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
