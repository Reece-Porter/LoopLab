// Multisample instrument engine. Each instrument is a set of note recordings
// (keyed by MIDI number); to play a note we pick the NEAREST recorded sample and
// pitch-shift it at most a few semitones, so it stays in tune across the range —
// a real sampler, not one sample stretched everywhere.
//
// A global mode ('samples' | 'synth') decides whether melodic voices use these
// samples or the original synth. Default 'samples'. Callers try the sampler and
// fall back to the synth when a voice isn't sampled or hasn't loaded yet, so it
// always degrades gracefully.

import { loadSample } from './sampleLoader'

const BASE = import.meta.env.BASE_URL

// Recorded MIDI notes available per instrument (files: samples/instruments/<id>/<midi>.wav).
export const INSTRUMENTS = {
  bass:     [24, 30, 36, 42, 48],
  reese:    [30, 36, 45, 48],
  piano:    [36, 42, 48, 54, 60, 66],
  supersaw: [36, 42, 48, 54, 60, 72],
  pad:      [30, 42, 54, 66],
  rhodes:   [48, 54, 60, 66, 72, 78],
}

const buffers = {} // id → { midi → AudioBuffer }
const listeners = new Set()
const KEY = 'looplab-instruments'

let mode = (() => { try { return localStorage.getItem(KEY) || 'samples' } catch { return 'samples' } })()

export function getInstrumentsMode() { return mode }
export function sampledActive() { return mode === 'samples' }
export function onInstrumentsChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export async function loadInstrument(ctx, id) {
  if (!INSTRUMENTS[id] || buffers[id]) return buffers[id]
  const map = {}
  await Promise.all(INSTRUMENTS[id].map(async midi => {
    const buf = await loadSample(ctx, `${BASE}samples/instruments/${id}/${midi}.wav`)
    if (buf) map[midi] = buf
  }))
  buffers[id] = map
  return map
}

export async function preloadInstruments(ctx, ids = Object.keys(INSTRUMENTS)) {
  await Promise.all(ids.map(id => loadInstrument(ctx, id)))
}

export function setInstrumentsMode(m) {
  mode = m
  try { localStorage.setItem(KEY, m) } catch { /* ignore */ }
  listeners.forEach(fn => fn(m))
}

export function freqToMidi(f) {
  return Math.round(69 + 12 * Math.log2(f / 440))
}

function playBuffer(ctx, buf, rate, time, out, gain, dur) {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = rate
  const g = ctx.createGain()
  const a = 0.005
  const rel = Math.min(0.35, dur * 0.5)
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gain, time + a)
  g.gain.setValueAtTime(gain, Math.max(time + a, time + dur - rel))
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  src.connect(g); g.connect(out)
  src.start(time)
  src.stop(time + dur + 0.05)
}

// Play one note. Returns true if a sample played; false → caller falls back to synth.
export function playNote(ctx, id, midi, time, out, gain = 0.5, dur = 0.5) {
  if (mode !== 'samples') return false
  const inst = buffers[id]
  if (!inst) return false
  const notes = Object.keys(inst).map(Number)
  if (!notes.length) return false
  let nearest = notes[0]
  for (const n of notes) if (Math.abs(n - midi) < Math.abs(nearest - midi)) nearest = n
  playBuffer(ctx, inst[nearest], Math.pow(2, (midi - nearest) / 12), time, out, gain, dur)
  return true
}

// Play a chord from an array of frequencies. Returns true if it played.
export function playChordSampled(ctx, id, freqs, time, out, gain = 0.5, dur = 0.6) {
  if (mode !== 'samples' || !buffers[id] || !freqs || !freqs.length) return false
  const per = gain / Math.sqrt(freqs.length)
  for (const f of freqs) if (f) playNote(ctx, id, freqToMidi(f), time, out, per, dur)
  return true
}

// Play a single tonal voice from a frequency. Returns true if it played.
export function playFreqSampled(ctx, id, freq, time, out, gain = 0.5, dur = 0.5) {
  if (mode !== 'samples' || !buffers[id] || !freq) return false
  return playNote(ctx, id, freqToMidi(freq), time, out, gain, dur)
}
