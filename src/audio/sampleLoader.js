// Fetches, decodes, and caches audio samples from URLs.
// Returns null (not a rejection) when a file is missing or fails to decode,
// so callers can show "unavailable" rather than crashing.

const cache = new Map() // src → Promise<AudioBuffer | null>

export async function loadSample(audioCtx, src) {
  if (cache.has(src)) return cache.get(src)
  const p = fetch(src)
    .then(r => (r.ok ? r.arrayBuffer() : null))
    .then(ab => (ab ? audioCtx.decodeAudioData(ab) : null))
    .catch(() => null)
  cache.set(src, p)
  return p
}

export function clearSampleCache() {
  cache.clear()
}
