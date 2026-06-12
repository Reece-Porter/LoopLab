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

// Bright stabbed piano chord — the backbone of piano house / classic house.
// Two slightly detuned saws per note through a bright lowpass with a fast,
// percussive decay so it "stabs" rather than sustains.
export function piano(context, time, out, freqs, gain = 0.26, dur = 0.5) {
  freqs.forEach(freq => {
    ;[-4, 4].forEach(d => {
      const osc = context.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      osc.detune.value = d
      const lp = context.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(4500, time)
      lp.frequency.exponentialRampToValueAtTime(1400, time + dur)
      const g = envGain(context, time, gain / freqs.length, 0.003, dur, out)
      osc.connect(lp).connect(g)
      osc.start(time)
      osc.stop(time + dur + 0.05)
    })
  })
}

// "Donk" — the bouncy bonk hit used in hard house / bouncy techno / donk.
// A fast downward pitch blip through a resonant bandpass for that wooden bonk.
export function donk(context, time, out, freq, gain = 0.5, dur = 0.18) {
  const osc = context.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(freq * 3, time)
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04)
  const bp = context.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq * 2
  bp.Q.value = 6
  const g = envGain(context, time, gain, 0.001, dur, out)
  osc.connect(bp).connect(g)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

// Hard, distorted rave-style hoover/stab for hard techno / schranz.
export function hoover(context, time, out, freq, gain = 0.3, dur = 0.3) {
  const g = envGain(context, time, gain, 0.004, dur, out)
  const shaper = context.createWaveShaper()
  shaper.curve = makeDistortion(20)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(5000, time)
  lp.frequency.exponentialRampToValueAtTime(900, time + dur)
  shaper.connect(lp).connect(g)
  ;[-7, -3, 0, 4, 7].forEach(d => {
    const osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq * 1.04, time)
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08)
    osc.detune.value = d
    osc.connect(shaper)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  })
}

// THE Bells stab — per the production deconstructions, Jeff Mills' "bells" are
// three oscillators stacked into a MINOR TRIAD (root + minor 3rd + 5th) per
// key, played as a punchy, bright, detuned chord stab — not a soft FM bell.
// Layered: a metallic high partial that rings short, and a sub-octave that
// holds longer (the track's two bell layers). Fast attack, percussive decay.
export function bell(context, time, out, freq, gain = 0.3, dur = 0.35) {
  const env = context.createGain()
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(gain, time + 0.003)
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  env.connect(out)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(7200, time)
  lp.frequency.exponentialRampToValueAtTime(2200, time + dur)
  lp.Q.value = 2
  lp.connect(env)
  // Minor triad: root, minor 3rd (×2^(3/12)), 5th (×2^(7/12)) — each lightly
  // detuned for the thick analog chord-stab character. Summed through a mix
  // gain so the six saws stay at unity before the envelope.
  const third = freq * 1.18921
  const fifth = freq * 1.49831
  const voices = [[freq, -7], [freq, 7], [third, -6], [third, 6], [fifth, -5], [fifth, 5]]
  const mix = context.createGain()
  mix.gain.value = 1 / voices.length
  mix.connect(lp)
  voices.forEach(([f, d]) => {
    const osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    osc.detune.value = d
    osc.connect(mix)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  })
  // Metallic high partial — the short, bright "ring" layer.
  const ring = context.createOscillator()
  ring.type = 'square'
  ring.frequency.value = freq * 3.01
  const rg = context.createGain()
  rg.gain.setValueAtTime(gain * 0.14, time)
  rg.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.5)
  rg.connect(out)
  ring.connect(rg)
  ring.start(time)
  ring.stop(time + dur + 0.05)
  // Sub-octave — the longer, lower bell layer that gives weight.
  const sub = context.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = freq / 2
  const sg = context.createGain()
  sg.gain.setValueAtTime(0, time)
  sg.gain.linearRampToValueAtTime(gain * 0.5, time + 0.004)
  sg.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.85)
  sg.connect(out)
  sub.connect(sg)
  sub.start(time)
  sub.stop(time + dur + 0.05)
}

// Lush detuned-saw trance pad — slow attack, airy octave, no muddiness.
// Used for Eurodance and trance chord beds.
export function synthPad(context, time, out, freqs, gain = 0.22, dur = 1.0) {
  const env = context.createGain()
  const attack = 0.22
  const rel = Math.min(0.5, dur * 0.28)
  const holdAt = Math.max(time + attack, time + dur - rel)
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(gain, time + attack)
  env.gain.setValueAtTime(gain, holdAt)
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(5000, time)
  lp.frequency.linearRampToValueAtTime(3200, time + dur)
  lp.Q.value = 0.5
  lp.connect(env)
  env.connect(out)
  const detunes = [-8, -2, 0, 2, 8]
  freqs.forEach(freq => {
    detunes.forEach(d => {
      const osc = context.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      osc.detune.value = d
      osc.connect(lp)
      osc.start(time)
      osc.stop(time + dur + 0.05)
    })
  })
}

// Rising noise+pitch sweep for FX/Riser sections before a drop.
export function riser(context, time, out, gain = 0.14, dur = 4.0) {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(200, time)
  lp.frequency.exponentialRampToValueAtTime(9000, time + dur)
  const g = context.createGain()
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gain, time + dur * 0.5)
  g.gain.linearRampToValueAtTime(gain * 1.8, time + dur)
  g.connect(out)
  noise.connect(lp).connect(g)
  noise.start(time)
  noise.stop(time + dur + 0.05)
  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(80, time)
  osc.frequency.exponentialRampToValueAtTime(3200, time + dur)
  const og = context.createGain()
  og.gain.setValueAtTime(0, time)
  og.gain.linearRampToValueAtTime(gain * 0.35, time + dur * 0.4)
  og.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.9)
  og.connect(out)
  osc.connect(og)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

// ---- Vocal (formant) synth -------------------------------------------------
// Three parallel band-pass filters tuned to real vowel formants turn a buzzy
// glottal source into a sung vowel. Cycling the vowel per note makes it sound
// like it's actually singing words rather than holding one "eee". A detuned
// 3-voice "choir" plus a little breath noise and delayed vibrato sell it.
const VOWEL_FORMANTS = {
  // [frequency Hz, relative gain] for F1, F2, F3
  ah: [[800, 1.0], [1150, 0.55], [2800, 0.12]],
  eh: [[440, 1.0], [1700, 0.45], [2600, 0.12]],
  ee: [[350, 1.0], [2100, 0.35], [2900, 0.12]],
  oh: [[450, 1.0], [800, 0.6], [2830, 0.08]],
  oo: [[325, 1.0], [700, 0.5], [2530, 0.06]],
}

export function vox(context, time, out, freq, gain = 0.3, dur = 0.8, vowel = 'ah', choir = true) {
  const formants = VOWEL_FORMANTS[vowel] || VOWEL_FORMANTS.ah

  // Master amplitude envelope: soft attack, hold, gentle release — so a note
  // sustains and "covers" its bar instead of plinking.
  const env = context.createGain()
  const rel = Math.min(0.3, dur * 0.45)
  const holdAt = Math.max(time + 0.08, time + dur - rel)
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(gain, time + 0.08)
  env.gain.setValueAtTime(gain, holdAt)
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  env.connect(out)

  // Source bus feeding the formant filters.
  const src = context.createGain()
  src.gain.value = 1

  // Subtle, slow vibrato that eases in late — too much reads as "cartoon opera".
  const vib = context.createOscillator()
  vib.frequency.value = 4.8
  const vibDepth = context.createGain()
  vibDepth.gain.value = freq * 0.007
  const vibEnv = context.createGain()
  vibEnv.gain.setValueAtTime(0, time)
  vibEnv.gain.linearRampToValueAtTime(1, time + Math.min(0.45, dur * 0.7))
  vib.connect(vibDepth).connect(vibEnv)
  vib.start(time); vib.stop(time + dur + 0.05)

  const detunes = choir ? [-5, 0, 5] : [0]
  detunes.forEach(d => {
    const osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)
    osc.detune.value = d
    vibEnv.connect(osc.frequency)
    osc.connect(src)
    osc.start(time); osc.stop(time + dur + 0.05)
  })

  // Parallel vowel formant filters — moderate Q so it's smooth, not nasal.
  formants.forEach(([f, a]) => {
    const bp = context.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = 5
    const fg = context.createGain()
    fg.gain.value = a
    src.connect(bp).connect(fg).connect(env)
  })

  // A little of the raw source, gently low-passed, adds warmth/body so it
  // doesn't sound thin and vocodery.
  const body = context.createBiquadFilter()
  body.type = 'lowpass'; body.frequency.value = 1600
  const bodyGain = context.createGain()
  bodyGain.gain.value = 0.18
  src.connect(body).connect(bodyGain).connect(env)

  // A touch of breath noise on the attack.
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 2500
  const ng = context.createGain()
  ng.gain.setValueAtTime(0, time)
  ng.gain.linearRampToValueAtTime(gain * 0.05, time + 0.04)
  ng.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur, 0.4))
  noise.connect(hp).connect(ng).connect(out)
  noise.start(time); noise.stop(time + Math.min(dur, 0.4) + 0.05)
}
