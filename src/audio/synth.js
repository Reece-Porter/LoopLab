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

// Kick with genre-authentic tone variants:
//  '909'   — TR-909 club kick: punchy sweep + attack click (house/techno/eurodance)
//  '808'   — TR-808 boom: low, long sine with drive (trap/hip-hop)
//  'rumble'— modern techno kick: 909 + saturated low rumble tail
//  'hard'  — distorted hard-techno/schranz kick: heavily driven, aggressive
//  'lofi'  — dusty boom-bap thump: round, soft, lowpassed
//  'dnb'   — tight punchy break kick: short and clicky
export function kick(context, time, out, gain = 1, tone = '909') {
  const osc = context.createOscillator()
  osc.type = 'sine'

  if (tone === '808') {
    osc.frequency.setValueAtTime(95, time)
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.09)
    const shaper = context.createWaveShaper()
    shaper.curve = makeDistortion(4)
    const g = envGain(context, time, gain, 0.002, 0.55, out)
    osc.connect(shaper).connect(g)
    osc.start(time); osc.stop(time + 0.65)
    return
  }

  if (tone === 'hard') {
    osc.frequency.setValueAtTime(165, time)
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.1)
    const shaper = context.createWaveShaper()
    shaper.curve = makeDistortion(30)
    const g = envGain(context, time, gain * 1.1, 0.001, 0.4, out)
    osc.connect(shaper).connect(g)
    osc.start(time); osc.stop(time + 0.5)
    // gritty attack click
    clickNoise(context, time, out, gain * 0.5, 2500, 0.02)
    return
  }

  if (tone === 'rumble') {
    // main punch
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.1)
    const g = envGain(context, time, gain, 0.001, 0.3, out)
    osc.connect(g)
    osc.start(time); osc.stop(time + 0.4)
    // saturated rumble tail filling the low end between kicks
    const tail = context.createOscillator()
    tail.type = 'sine'
    tail.frequency.setValueAtTime(55, time + 0.02)
    tail.frequency.exponentialRampToValueAtTime(42, time + 0.3)
    const shaper = context.createWaveShaper()
    shaper.curve = makeDistortion(12)
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 160
    const tg = envGain(context, time + 0.02, gain * 0.5, 0.02, 0.34, out)
    tail.connect(shaper).connect(lp).connect(tg)
    tail.start(time + 0.02); tail.stop(time + 0.45)
    clickNoise(context, time, out, gain * 0.35, 3000, 0.012)
    return
  }

  if (tone === 'lofi') {
    osc.frequency.setValueAtTime(105, time)
    osc.frequency.exponentialRampToValueAtTime(52, time + 0.08)
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 700
    const g = envGain(context, time, gain * 0.9, 0.004, 0.22, out)
    osc.connect(lp).connect(g)
    osc.start(time); osc.stop(time + 0.3)
    return
  }

  if (tone === 'dnb') {
    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.05)
    const g = envGain(context, time, gain, 0.001, 0.14, out)
    osc.connect(g)
    osc.start(time); osc.stop(time + 0.2)
    clickNoise(context, time, out, gain * 0.4, 4000, 0.01)
    return
  }

  // default '909' — punchy club kick with attack click
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.12)
  const g = envGain(context, time, gain, 0.001, 0.32, out)
  osc.connect(g)
  osc.start(time)
  osc.stop(time + 0.4)
  clickNoise(context, time, out, gain * 0.25, 3500, 0.01)
}

// Short filtered noise burst — the attack "click" that makes kicks punch.
function clickNoise(context, time, out, gain, hpFreq, dur) {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = hpFreq
  const g = envGain(context, time, gain, 0.0005, dur, out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + dur + 0.02)
}

// Snare with genre-authentic tone variants:
//  '909'  — classic club snare (default)
//  'trap' — bright sharp crack, short
//  'lofi' — dusty, soft, lowpassed boom-bap snare
//  'dnb'  — tight layered break snare, hard crack
//  'garage' — snappy UKG snare with a pitched ring
export function snare(context, time, out, gain = 0.7, tone = '909') {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)

  if (tone === 'trap') {
    const hp = context.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 2200
    const g = envGain(context, time, gain * 1.05, 0.001, 0.13, out)
    noise.connect(hp).connect(g)
    noise.start(time); noise.stop(time + 0.16)
    const osc = context.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(240, time)
    osc.frequency.exponentialRampToValueAtTime(160, time + 0.05)
    const g2 = envGain(context, time, gain * 0.4, 0.001, 0.07, out)
    osc.connect(g2); osc.start(time); osc.stop(time + 0.1)
    return
  }

  if (tone === 'lofi') {
    const bp = context.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.8
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 3200
    const g = envGain(context, time, gain * 0.85, 0.002, 0.17, out)
    noise.connect(bp).connect(lp).connect(g)
    noise.start(time); noise.stop(time + 0.22)
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(165, time)
    const g2 = envGain(context, time, gain * 0.45, 0.002, 0.09, out)
    osc.connect(g2); osc.start(time); osc.stop(time + 0.12)
    return
  }

  if (tone === 'dnb') {
    const hp = context.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 1900
    const g = envGain(context, time, gain * 1.15, 0.001, 0.11, out)
    noise.connect(hp).connect(g)
    noise.start(time); noise.stop(time + 0.14)
    const osc = context.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, time)
    osc.frequency.exponentialRampToValueAtTime(170, time + 0.04)
    const g2 = envGain(context, time, gain * 0.6, 0.001, 0.06, out)
    osc.connect(g2); osc.start(time); osc.stop(time + 0.09)
    return
  }

  if (tone === 'garage') {
    const hp = context.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 1600
    const g = envGain(context, time, gain, 0.001, 0.14, out)
    noise.connect(hp).connect(g)
    noise.start(time); noise.stop(time + 0.18)
    const osc = context.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(330, time)
    osc.frequency.exponentialRampToValueAtTime(190, time + 0.06)
    const g2 = envGain(context, time, gain * 0.5, 0.001, 0.1, out)
    osc.connect(g2); osc.start(time); osc.stop(time + 0.13)
    return
  }

  // default '909'
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1500
  const g = envGain(context, time, gain, 0.001, 0.2, out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + 0.25)
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

// Hi-hat with tone variants: '909' (default), 'trap' (tight ticky), 'lofi' (dusty soft).
export function hat(context, time, out, gain = 0.4, open = false, tone = '909') {
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const hp = context.createBiquadFilter()
  hp.type = 'highpass'
  let decay
  if (tone === 'trap') {
    hp.frequency.value = 8500
    decay = open ? 0.22 : 0.03
  } else if (tone === 'lofi') {
    hp.frequency.value = 5500
    decay = open ? 0.22 : 0.05
    gain *= 0.75
  } else {
    hp.frequency.value = 7000
    decay = open ? 0.3 : 0.05
  }
  const g = envGain(context, time, gain, 0.001, decay, out)
  noise.connect(hp).connect(g)
  noise.start(time)
  noise.stop(time + decay + 0.05)
}

// Conga / tom for tribal percussion (hard groove, tech house) — pitched
// short sine with a quick downward bend and a soft skin-slap transient.
export function conga(context, time, out, gain = 0.45, freq = 220) {
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq * 1.18, time)
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04)
  const g = envGain(context, time, gain, 0.002, 0.16, out)
  osc.connect(g)
  osc.start(time); osc.stop(time + 0.22)
  const noise = context.createBufferSource()
  noise.buffer = getNoise(context)
  const bp = context.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = freq * 6; bp.Q.value = 1.2
  const ng = envGain(context, time, gain * 0.3, 0.001, 0.03, out)
  noise.connect(bp).connect(ng)
  noise.start(time); noise.stop(time + 0.06)
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

// Supersaw chord — detuned saws per note, pumping Eurodance/trance pad stab.
export function supersawChord(context, time, out, freqs, gain = 0.28, dur = 0.8) {
  const detunes = [-10, -4, 0, 4, 10]
  freqs.forEach(freq => {
    const lp = context.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(5000, time)
    lp.frequency.exponentialRampToValueAtTime(1800, time + dur * 0.6)
    const g = envGain(context, time, gain / freqs.length, 0.006, dur, out)
    lp.connect(g)
    detunes.forEach(d => {
      const osc = context.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      osc.detune.value = d
      osc.connect(lp)
      osc.start(time)
      osc.stop(time + dur + 0.1)
    })
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

// TB-303 acid bass — saw through a resonant lowpass whose cutoff sweeps down
// fast. `accent` opens the filter further and bumps the gain, like the 303's
// accent knob. The squelch IS the cutoff envelope.
export function acid(context, time, out, freq, gain = 0.38, dur = 0.22, accent = false) {
  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  const lp = context.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.value = accent ? 14 : 9
  const top = accent ? freq * 14 : freq * 8
  lp.frequency.setValueAtTime(Math.min(8000, top), time)
  lp.frequency.exponentialRampToValueAtTime(freq * 1.6, time + dur * 0.85)
  const g = envGain(context, time, gain * (accent ? 1.25 : 1), 0.002, dur, out)
  osc.connect(lp).connect(g)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

// Garage / house organ stab (M1-organ / Hammond flavour) — additive drawbar
// sines (1, 2, 3, 4 ×) with a percussive 4× "key click" partial and a fast
// shallow vibrato. The sound of UKG, speed garage and organ house.
export function organ(context, time, out, freqs, gain = 0.3, dur = 0.3) {
  const vib = context.createOscillator()
  vib.frequency.value = 6.5
  const vibAmt = context.createGain()
  vibAmt.gain.value = 3.5
  vib.connect(vibAmt)
  vib.start(time); vib.stop(time + dur + 0.05)

  const drawbars = [[1, 1.0], [2, 0.55], [3, 0.25], [4, 0.32]]
  freqs.forEach(freq => {
    drawbars.forEach(([mult, amp]) => {
      const o = context.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq * mult
      vibAmt.connect(o.detune)
      const g = envGain(context, time, (gain * amp) / freqs.length, 0.004, dur, out)
      o.connect(g)
      o.start(time); o.stop(time + dur + 0.05)
    })
    // percussive key-click partial — fast decay regardless of dur
    const click = context.createOscillator()
    click.type = 'sine'
    click.frequency.value = freq * 4
    const cg = envGain(context, time, (gain * 0.5) / freqs.length, 0.001, 0.06, out)
    click.connect(cg)
    click.start(time); click.stop(time + 0.1)
  })
}

// Clean sine sub bass with gentle saturation — DnB / UKG / trap low end.
export function sub(context, time, out, freq, gain = 0.55, dur = 0.5) {
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const shaper = context.createWaveShaper()
  shaper.curve = makeDistortion(3)
  const g = context.createGain()
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(gain, time + 0.01)
  g.gain.setValueAtTime(gain, Math.max(time + 0.01, time + dur - 0.08))
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  g.connect(out)
  osc.connect(shaper).connect(g)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

// Rhodes-style electric piano — sine fundamental + quiet bell tine partial
// (≈3.5×) + slow tremolo. Warmer and more "played" than softKeys; the lo-fi
// hip-hop and deep house chord sound.
export function rhodes(context, time, out, freqs, gain = 0.24, dur = 0.8) {
  const trem = context.createOscillator()
  trem.frequency.value = 4.2
  const tremAmt = context.createGain()
  tremAmt.gain.value = 0.18
  const tremBus = context.createGain()
  tremBus.gain.value = 0.88
  trem.connect(tremAmt).connect(tremBus.gain)
  tremBus.connect(out)
  trem.start(time); trem.stop(time + dur + 0.05)

  freqs.forEach(freq => {
    const fund = context.createOscillator()
    fund.type = 'sine'
    fund.frequency.value = freq
    const fg = envGain(context, time, (gain * 0.9) / freqs.length, 0.006, dur, tremBus)
    fund.connect(fg)
    fund.start(time); fund.stop(time + dur + 0.05)

    const tine = context.createOscillator()
    tine.type = 'sine'
    tine.frequency.value = freq * 3.52 // slightly inharmonic tine "ding"
    const tg = envGain(context, time, (gain * 0.16) / freqs.length, 0.002, dur * 0.3, tremBus)
    tine.connect(tg)
    tine.start(time); tine.stop(time + dur * 0.4)

    const oct = context.createOscillator()
    oct.type = 'triangle'
    oct.frequency.value = freq * 2
    const og = envGain(context, time, (gain * 0.18) / freqs.length, 0.01, dur * 0.7, tremBus)
    oct.connect(og)
    oct.start(time); oct.stop(time + dur + 0.05)
  })
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

// Metallic bell tone — triangle fundamental + detuned sine partial for shimmer.
// Sharp percussive strike, long ring-out, no distortion.
export function bell(context, time, out, freq, gain = 0.3, dur = 2.0) {
  const bus = context.createGain()
  bus.gain.value = 1

  // Triangle fundamental — warm but with clear pitch
  const tri = context.createOscillator()
  tri.type = 'triangle'
  tri.frequency.value = freq
  const triG = context.createGain()
  triG.gain.value = 0.65
  tri.connect(triG).connect(bus)

  // Slightly detuned sine an octave up — adds shimmer/metallic ring
  const upper = context.createOscillator()
  upper.type = 'sine'
  upper.frequency.value = freq * 2.01
  const upG = context.createGain()
  upG.gain.value = 0.35
  upper.connect(upG).connect(bus)

  // Sharp strike, long exponential decay
  const env = context.createGain()
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(gain, time + 0.002)
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  bus.connect(env).connect(out)

  // Dotted-8th delay at 137 BPM (≈ 0.22s) with gentle feedback
  const dly = context.createDelay(1)
  dly.delayTime.value = 0.22
  const fb = context.createGain()
  fb.gain.value = 0.22
  const wet = context.createGain()
  wet.gain.value = 0.35
  env.connect(dly)
  dly.connect(fb).connect(dly)
  dly.connect(wet).connect(out)

  ;[tri, upper].forEach(o => { o.start(time); o.stop(time + dur + 0.5) })
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
