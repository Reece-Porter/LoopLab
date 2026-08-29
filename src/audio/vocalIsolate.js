// Client-side vocal isolation + WAV export for the Vocal Isolator page.
//
// This is the ROUGH, no-server method: "centre extraction". A vocal is usually
// mixed dead-centre, so summing the two channels keeps it while a band-pass
// trims the centred kick/sub and the very top end. It is NOT true source
// separation — centred drums/bass leak through and it needs a stereo track —
// but it runs instantly in the browser with no upload. The plan is to swap in
// a proper AI model (Demucs) on the Render backend later behind the same UI.

// Trim an AudioBuffer to the [start..end] fraction (0..1).
export function trimBuffer(ctx, buffer, start, end) {
  const from = Math.floor(start * buffer.length)
  const to = Math.ceil(end * buffer.length)
  const length = Math.max(1, to - from)
  const out = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.copyToChannel(buffer.getChannelData(c).slice(from, to), c)
  }
  return out
}

// Rough vocal isolation via centre extraction + a vocal-band filter. Returns a
// mono AudioBuffer. Works best on stereo tracks; a mono input just gets filtered.
export async function isolateVocalCentre(buffer) {
  const sr = buffer.sampleRate
  const len = buffer.length
  const L = buffer.getChannelData(0)
  const R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : L

  // Mid (centre) = (L+R)/2 — keeps the centred vocal.
  const mid = new Float32Array(len)
  for (let i = 0; i < len; i++) mid[i] = (L[i] + R[i]) * 0.5

  // Render the mid channel through a vocal band-pass with a presence lift.
  const off = new OfflineAudioContext(1, len, sr)
  const midBuf = off.createBuffer(1, len, sr)
  midBuf.copyToChannel(mid, 0)
  const src = off.createBufferSource()
  src.buffer = midBuf

  const hp = off.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 140; hp.Q.value = 0.7   // cut centred kick/sub
  const lp = off.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = 9000                     // tame cymbal bleed
  const presence = off.createBiquadFilter()
  presence.type = 'peaking'; presence.frequency.value = 2600; presence.gain.value = 3; presence.Q.value = 0.9

  src.connect(hp); hp.connect(lp); lp.connect(presence); presence.connect(off.destination)
  src.start()
  return off.startRendering()
}

// Encode an AudioBuffer as a 16-bit PCM WAV Blob (for download).
export function encodeWav(buffer) {
  const numCh = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const numFrames = buffer.length
  const bytesPerSample = 2
  const blockAlign = numCh * bytesPerSample
  const dataLen = numFrames * blockAlign
  const ab = new ArrayBuffer(44 + dataLen)
  const view = new DataView(ab)

  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLen, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)          // PCM chunk size
  view.setUint16(20, 1, true)           // PCM format
  view.setUint16(22, numCh, true)
  view.setUint32(24, sr, true)
  view.setUint32(28, sr * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)          // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataLen, true)

  const channels = []
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}
