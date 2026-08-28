// Sampled drum kit (MusicRadar "Electro" one-shots, free to use).
// Loaded and cached via the existing sampleLoader; played as AudioBufferSources.
// Falls back silently to the synth when a sample isn't loaded yet, so nothing
// breaks if the files are missing or still decoding.

import { loadSample } from './sampleLoader'

const BASE = import.meta.env.BASE_URL

export const DRUM_KIT = {
  kick:      `${BASE}samples/kit/kick.wav`,
  snare:     `${BASE}samples/kit/snare.wav`,
  clap:      `${BASE}samples/kit/clap.wav`,
  hatClosed: `${BASE}samples/kit/hat-closed.wav`,
  hatOpen:   `${BASE}samples/kit/hat-open.wav`,
}

const buffers = {} // voiceKey → AudioBuffer

// Decode every kit sample into memory. Safe to call repeatedly (cached). Works
// on a suspended AudioContext — decoding doesn't need a user gesture.
export async function loadDrumKit(ctx) {
  await Promise.all(Object.entries(DRUM_KIT).map(async ([voice, src]) => {
    const buf = await loadSample(ctx, src)
    if (buf) buffers[voice] = buf
  }))
  return buffers
}

export function kitReady() {
  return !!buffers.kick
}

// Play one kit voice at an absolute time. Returns true if a sample played, false
// if it isn't loaded (so the caller can fall back to the synth).
export function playKitVoice(ctx, voiceKey, time, out, gain = 1) {
  const buf = buffers[voiceKey]
  if (!buf) return false
  const src = ctx.createBufferSource()
  src.buffer = buf
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(g)
  g.connect(out)
  src.start(time)
  return true
}
