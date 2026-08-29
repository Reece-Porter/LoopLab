// Selectable sampled drum kits (MusicRadar one-shots, free to use).
// A global "active kit" applies across the whole site — arrangements, the custom
// builder and the track-starter generator all read it. "Synth" keeps the original
// hand-written drum sounds. Missing voices in a kit fall back to the synth, so
// nothing ever breaks.

import { loadSample } from './sampleLoader'
import { getContext } from './synth'

const BASE = import.meta.env.BASE_URL
const VOICES = ['kick', 'snare', 'clap', 'hatClosed', 'hatOpen', 'perc']
const FILE = { kick: 'kick', snare: 'snare', clap: 'clap', hatClosed: 'hat-closed', hatOpen: 'hat-open', perc: 'perc' }

export const KITS = [
  { id: 'synth',    label: 'Synth' },
  { id: 'electro',  label: 'Electro' },
  { id: 'vinyl',    label: 'Vinyl' },
  { id: 'acoustic', label: 'Acoustic' },
]

const buffers = {} // kitId → { voiceKey → AudioBuffer }
const listeners = new Set()
const KEY = 'looplab-kit'

let activeKit = (() => { try { return localStorage.getItem(KEY) || 'synth' } catch { return 'synth' } })()

export function getActiveKit() { return activeKit }
export function onKitChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

// Load (and cache) one kit's samples. No-op for 'synth'.
export async function loadKit(id) {
  if (id === 'synth' || buffers[id]) return buffers[id]
  const ctx = getContext()
  const map = {}
  await Promise.all(VOICES.map(async v => {
    const buf = await loadSample(ctx, `${BASE}samples/kit/${id}/${FILE[v]}.wav`)
    if (buf) map[v] = buf
  }))
  buffers[id] = map
  return map
}

export async function setActiveKit(id) {
  activeKit = id
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  listeners.forEach(fn => fn(id))
  if (id !== 'synth') await loadKit(id)
}

export function kitReady(id = activeKit) {
  return id === 'synth' ? true : !!(buffers[id] && buffers[id].kick)
}

// Play the active kit's voice at an absolute time. Returns true if a sample
// played; false means the caller should fall back to the synth.
export function playKitVoice(ctx, voiceKey, time, out, gain = 1) {
  if (activeKit === 'synth') return false
  const buf = buffers[activeKit] && buffers[activeKit][voiceKey]
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
