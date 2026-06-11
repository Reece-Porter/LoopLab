// Lightweight Web Audio synth — generates drum and tonal sounds on the fly,
// no samples needed.

let ctx = null

export function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Shared noise buffer for percussion.
let noiseBuffer = null
function getNoise(context) {
  if (!noiseBuffer) {
    const len = context.sampleRate * 1
    noiseBuffer = context.createBuffer(1, len, context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function envGain(context, time, peak, attack, decay, out) {
  const g = context.createGain()
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(peak, time + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay)
  g.connect(out)
  return g
}

export function kick(context, time, out, gain = 1) {
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.12)
  const g = envGain(context, time, gain, 0.001, 0.32, out)
  osc.connect(g)
  osc.start(time)
  osc.stop(time + 0.4)
}

export function snare(context, time, out, gain = 0.7) {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1500
  const g = envGain(context, time, gain, 0.001, 0.2, out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + 0.25)
  // tonal body
  const osc = context.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(180, time)
  const g2 = envGain(context, time, gain * 0.5, 0.001, 0.12, out)
  osc.connect(g2)
  osc.start(time)
  osc.stop(time + 0.15)
}

export function clap(context, time, out, gain = 0.6) {
  for (let i = 0; i < 3; i++) {
    const noise = context.createBufferSource()
    noise.buffer = getNoise(context)
    const bp = context.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1200
    bp.Q.value = 1.5
    const t = time + i * 0.012
    const g = envGain(context, t, gain, 0.001, 0.1, out)
    noise.connect(bp).connect(g)
    noise.start(t)
    noise.stop(t + 0.12)
  }
}

export function hat(context, time, out, gain = 0.4, open = false) {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const decay = open ? 0.3 : 0.05
  const g = envGain(context, time, gain, 0.001, decay, out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + decay + 0.05)
}

export function eight08(context, time, out, freq, gain = 0.9, dur = 0.6) {
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq * 1.5, time)
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05)
  const g = context.createGain()
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gain, time + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  const shaper = context.createWaveShaper()
  shaper.curve = makeDistortion(8)
  osc.connect(shaper).connect(g).connect(out)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

export function bass(context, time, out, freq, gain = 0.5, dur = 0.2) {
  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 800
  const g = envGain(context, time, gain, 0.005, dur, out)
  osc.connect(lp).connect(g)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

export function pluck(context, time, out, freq, gain = 0.35, dur = 0.3) {
  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(5000, time)
  lp.frequency.exponentialRampToValueAtTime(800, time + dur)
  const g = envGain(context, time, gain, 0.005, dur, out)
  osc.connect(lp).connect(g)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

export function chordStab(context, time, out, freqs, gain = 0.25, dur = 0.5, soft = false) {
  freqs.forEach(freq => {
    const osc = context.createOscillator()
    osc.type = soft ? 'triangle' : 'sawtooth'
    osc.frequency.value = freq
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = soft ? 2000 : 3500
    const attack = soft ? 0.08 : 0.005
    const g = envGain(context, time, gain / freqs.length, attack, dur, out)
    osc.connect(lp).connect(g)
    osc.start(time)
    osc.stop(time + dur + attack + 0.05)
  })
}

function makeDistortion(amount) {
  const n = 256
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

// Detuned super-saw stab — the classic hoover/trance lead used in Eurodance.
export function supersaw(context, time, out, freq, gain = 0.3, dur = 0.25) {
  const detunes = [-12, -5, 0, 5, 12]
  const g = envGain(context, time, gain, 0.004, dur, out)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(6000, time)
  lp.frequency.exponentialRampToValueAtTime(1500, time + dur)
  lp.connect(g)
  detunes.forEach(d => {
    const osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = d
    osc.connect(lp)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  })
}

// Growling Reese bass — two detuned saws through a moving lowpass. DnB staple.
export function reese(context, time, out, freq, gain = 0.4, dur = 0.5) {
  const g = envGain(context, time, gain, 0.01, dur, out)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 600
  lp.Q.value = 6
  lp.connect(g)
  ;[-14, 0, 11].forEach(d => {
    const osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = d
    osc.connect(lp)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  })
}

// Soft electric-piano-ish keys for Lo-Fi / Deep House chords.
export function softKeys(context, time, out, freqs, gain = 0.22, dur = 0.7) {
  freqs.forEach(freq => {
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const osc2 = context.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.value = freq * 2
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1800
    const g = envGain(context, time, gain / freqs.length, 0.02, dur, out)
    osc.connect(lp)
    osc2.connect(g) // subtle harmonic
    lp.connect(g)
    osc.start(time); osc.stop(time + dur + 0.05)
    osc2.start(time); osc2.stop(time + dur * 0.4)
  })
}

// Quiet vinyl crackle layer for Lo-Fi atmosphere.
export function vinyl(context, time, out, gain = 0.04, dur = 0.5) {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000
  const g = context.createGain()
  g.gain.value = gain
  g.connect(out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + dur)
}
