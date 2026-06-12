// Client-side BPM detection.
// Algorithm:
//  1. Render the audio buffer through an OfflineAudioContext with a low-pass
//     filter (100 Hz) to isolate kick-drum / bass transients.
//  2. Compute a rectified amplitude envelope (block RMS, ~10 ms blocks).
//  3. Find onset peaks above a dynamic threshold.
//  4. Bucket the inter-onset intervals into a BPM histogram (60–200 BPM).
//  5. Return the BPM with the most votes, also checking half/double time.

const LP_FREQ   = 150    // Hz — low-pass to focus on kick transients
const BLOCK_MS  = 10     // envelope block size in ms
const THRESHOLD = 1.4    // onset must be > threshold × local average
const MIN_BPM   = 60
const MAX_BPM   = 200
const ANALYSE_S = 60     // only analyse the first N seconds (fast + accurate)

export async function detectBpm(audioBuffer) {
  const sr   = audioBuffer.sampleRate
  const len  = Math.min(audioBuffer.length, Math.round(sr * ANALYSE_S))

  // ── 1. Low-pass filter via OfflineAudioContext ───────────────────────────
  const off  = new OfflineAudioContext(1, len, sr)
  const src  = off.createBufferSource()

  // Use only the first channel for speed; copy it into a mono buffer.
  const mono = off.createBuffer(1, len, sr)
  mono.copyToChannel(audioBuffer.getChannelData(0).slice(0, len), 0)
  src.buffer = mono

  const lp = off.createBiquadFilter()
  lp.type            = 'lowpass'
  lp.frequency.value = LP_FREQ
  lp.Q.value         = 0.5

  src.connect(lp)
  lp.connect(off.destination)
  src.start(0)
  const filtered = await off.startRendering()
  const signal   = filtered.getChannelData(0)

  // ── 2. RMS envelope ───────────────────────────────────────────────────────
  const blockSize = Math.round(sr * BLOCK_MS / 1000)
  const numBlocks = Math.floor(signal.length / blockSize)
  const env       = new Float32Array(numBlocks)
  for (let b = 0; b < numBlocks; b++) {
    let sum = 0
    const off2 = b * blockSize
    for (let i = 0; i < blockSize; i++) sum += signal[off2 + i] ** 2
    env[b] = Math.sqrt(sum / blockSize)
  }

  // ── 3. Onset detection ────────────────────────────────────────────────────
  const WIN  = 20   // local average window (blocks)
  const onsets = []
  for (let b = WIN; b < numBlocks - 1; b++) {
    // Simple spectral flux: is this block a local energy peak?
    const prev  = env[b - 1]
    const cur   = env[b]
    if (cur <= prev) continue        // not a rise
    // Local average (excluding current block)
    let avg = 0
    for (let w = b - WIN; w < b; w++) avg += env[w]
    avg /= WIN
    if (cur > avg * THRESHOLD && cur > 0.001) {
      onsets.push(b * BLOCK_MS / 1000)   // time in seconds
      b += 3  // small refractory period (~30 ms) to avoid double-triggers
    }
  }

  if (onsets.length < 4) return null  // not enough onsets to estimate

  // ── 4. Inter-onset interval histogram → BPM ──────────────────────────────
  // Use only adjacent-onset intervals for accuracy.
  const hist = new Float32Array(MAX_BPM + 1)
  for (let i = 1; i < onsets.length; i++) {
    const dt  = onsets[i] - onsets[i - 1]
    const bpm = 60 / dt
    // Vote for this BPM and its half/double (weight nearer neighbours more).
    for (const cand of [bpm, bpm * 2, bpm / 2]) {
      const r = Math.round(cand)
      if (r >= MIN_BPM && r <= MAX_BPM) {
        // Gaussian weight: 1 at exact match, falls off ±2 BPM.
        for (let d = -2; d <= 2; d++) {
          const idx = r + d
          if (idx >= MIN_BPM && idx <= MAX_BPM)
            hist[idx] += Math.exp(-(d * d) / 2)
        }
      }
    }
  }

  // ── 5. Pick winner ────────────────────────────────────────────────────────
  let best = MIN_BPM, bestScore = 0
  for (let b = MIN_BPM; b <= MAX_BPM; b++) {
    if (hist[b] > bestScore) { bestScore = hist[b]; best = b }
  }

  return best
}
