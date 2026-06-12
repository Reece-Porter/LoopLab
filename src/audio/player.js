// Sequencer — schedules a looping pattern using a lookahead scheduler and
// fires a callback so the UI can highlight the current step.

import { getContext } from './synth'
import * as S from './synth'
import { noteToFreq, chordToFreqs } from './theory'
import { grooveFor } from './grooves'

// Decide which synth voice a part uses, from its name.
export function voiceFor(partName) {
  const n = partName.toLowerCase()
  if (n.includes('808')) return 'eight08'
  if (n.includes('kick')) return 'kick'
  if (n.includes('clap')) return 'clap'
  if (n.includes('snare') || n.includes('rim')) return 'snare'
  if (n.includes('perc') || n.includes('ride') || n.includes('tom')) return 'perc'
  if (n.includes('hat') || n.includes('hi-hat')) return 'hat'
  if (n.includes('break')) return 'break'
  if (n.includes('donk') || n.includes('bounce')) return 'donk'
  if (n.includes('piano')) return 'piano'
  if (n.includes('organ')) return 'piano'
  if (n.includes('reese')) return 'reese'
  if (n.includes('sub') || n.includes('bass')) return 'bass'
  if (n.includes('rumble')) return 'kick'
  if (n.includes('fx') || n.includes('riser') || n.includes('atmos')) return 'riser'
  if (n.includes('chord') || n.includes('pad') || n.includes('key')) return 'chord'
  if (n.includes('vocal') || n.includes('vox') || n.includes('voice')) return 'vox'
  if (n.includes('hoover') || n.includes('stab') || n.includes('rave') ||
      n.includes('acid')) return 'supersaw'
  if (n.includes('lead') || n.includes('melody') || n.includes('synth') ||
      n.includes('sample')) return 'pluck'
  return 'pluck'
}

// Build a list of { step, action } events (and total step count) for a pattern.
function compile(pattern, partName) {
  const voice = voiceFor(partName)

  if (pattern.type === 'steps') {
    const steps = pattern.steps
    const events = []
    steps.forEach((v, i) => {
      if (v) events.push({ step: i, value: v })
    })
    return { totalSteps: steps.length, events, voice, kind: 'drum' }
  }

  if (pattern.type === 'notes') {
    const tokens = pattern.value.split(/\s+/).filter(t => t !== '→')
    const events = []
    tokens.forEach((tok, i) => {
      if (tok !== '–' && noteToFreq(tok)) {
        events.push({ step: i, freq: noteToFreq(tok) })
      }
    })
    return { totalSteps: tokens.length, events, voice, kind: 'note' }
  }

  if (pattern.type === 'chords') {
    const chords = pattern.value.replace(/\(.*?\)/g, '').split(/\s+–\s+/).map(c => c.trim()).filter(Boolean)
    const events = chords.map((c, i) => ({ step: i, freqs: chordToFreqs(c) }))
    return { totalSteps: chords.length, events, voice: 'chord', kind: 'chord' }
  }

  return null
}

function trigger(ctx, voice, kind, ev, time, out) {
  switch (kind) {
    case 'drum':
      if (voice === 'kick') S.kick(ctx, time, out)
      else if (voice === 'snare') S.snare(ctx, time, out)
      else if (voice === 'hat') S.hat(ctx, time, out, 0.4, ev.value === 2)
      else if (voice === 'break') {
        // alternate kick/snare feel
        if (ev.step % 8 < 4) S.kick(ctx, time, out, 0.9)
        else S.snare(ctx, time, out, 0.5)
      } else S.kick(ctx, time, out)
      break
    case 'note':
      if (voice === 'eight08') S.eight08(ctx, time, out, ev.freq)
      else if (voice === 'bass') S.bass(ctx, time, out, ev.freq)
      else S.pluck(ctx, time, out, ev.freq)
      break
    case 'chord':
      S.chordStab(ctx, time, out, ev.freqs, 0.3, 0.6, true)
      break
    default:
      break
  }
}

// Start looping a pattern. Returns a transport with stop().
// onStep(currentStep) is called (via rAF-safe setTimeout) for UI highlight.
export function playPattern(pattern, partName, bpm, { withClick = true, onStep } = {}) {
  const ctx = getContext()
  const compiled = compile(pattern, partName)
  if (!compiled) return { stop() {} }

  const out = ctx.createGain()
  out.gain.value = 0.9
  out.connect(ctx.destination)

  const { totalSteps, events, voice, kind } = compiled
  // Drum/step patterns run as 16th notes; note/chord patterns as 8th notes.
  const stepsPerBeat = kind === 'drum' ? 4 : 2
  const stepDur = 60 / bpm / stepsPerBeat

  let currentStep = 0
  let nextStepTime = ctx.currentTime + 0.1
  let timer = null
  let stopped = false

  function scheduler() {
    if (stopped) return
    while (nextStepTime < ctx.currentTime + 0.1) {
      const step = currentStep % totalSteps

      events.filter(e => e.step === step).forEach(ev => {
        trigger(ctx, voice, kind, ev, nextStepTime, out)
      })

      // metronome click on each beat
      if (withClick && step % stepsPerBeat === 0) {
        S.hat(ctx, nextStepTime, out, step === 0 ? 0.18 : 0.1, false)
      }

      if (onStep) {
        const t = (nextStepTime - ctx.currentTime) * 1000
        const s = step
        setTimeout(() => { if (!stopped) onStep(s) }, Math.max(0, t))
      }

      nextStepTime += stepDur
      currentStep++
    }
    timer = setTimeout(scheduler, 25)
  }
  scheduler()

  return {
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      try { out.disconnect() } catch { /* already gone */ }
      if (onStep) onStep(-1)
    },
  }
}

// Shared synth dispatch: render one normalised clip event for a voice at an
// absolute audio time. Used by both the genre arrangement and the custom
// arrangement builder so they always sound identical.
function fireEvent(ctx, out, voice, evt, t, stepDur, snareAsClap = false) {
  if (evt.drum) {
    if (voice === 'kick') return S.kick(ctx, t, out, 1)
    if (voice === 'clap') return S.clap(ctx, t, out, 0.6)
    if (voice === 'perc') return S.hat(ctx, t, out, 0.32, true)
    if (voice === 'snare') return (snareAsClap ? S.clap : S.snare)(ctx, t, out, 0.6)
    if (voice === 'hat') return S.hat(ctx, t, out, 0.3, !!evt.open)
    if (voice === 'break') {
      const isSnare = evt.breakSnare || (evt.breakStep != null && evt.breakStep % 8 >= 4)
      return isSnare ? S.snare(ctx, t, out, 0.55) : S.kick(ctx, t, out, 0.9)
    }
    return S.kick(ctx, t, out, 1)
  }
  if (evt.freqs) {
    if (voice === 'piano') return S.piano(ctx, t, out, evt.freqs, 0.24, evt.pad ? stepDur * 8 : stepDur * 3)
    if (evt.pad) return S.synthPad(ctx, t, out, evt.freqs, 0.20, stepDur * 12)
    if (evt.keys) return S.softKeys(ctx, t, out, evt.freqs, 0.22, stepDur * 6)
    return S.chordStab(ctx, t, out, evt.freqs, 0.26, stepDur * 4, true)
  }
  if (voice === 'riser') return S.riser(ctx, t, out, 0.14, stepDur * 64)
  if (evt.freq != null) {
    const f = evt.freq
    if (evt.bell) return S.bell(ctx, t, out, f, 0.26, stepDur * 1.8)
    if (evt.hoover) return S.hoover(ctx, t, out, f, 0.26, stepDur * 2.2)
    if (voice === 'reese') return S.reese(ctx, t, out, f, 0.4, stepDur * 3)
    if (voice === 'donk') return S.donk(ctx, t, out, f, 0.5, stepDur * 1.4)
    if (voice === 'eight08') return S.eight08(ctx, t, out, f, 0.9, evt.long ? stepDur * 6 : 0.5)
    if (voice === 'bass') return S.bass(ctx, t, out, f, 0.5, evt.long ? stepDur * 4 : stepDur * 1.5)
    if (voice === 'supersaw') return S.supersaw(ctx, t, out, f, 0.28, stepDur * 1.8)
    if (voice === 'piano') return S.piano(ctx, t, out, [f], 0.22, stepDur * 3)
    if (voice === 'vox') return S.vox(ctx, t, out, f, 0.2, stepDur * (evt.sustain || 6), evt.vowel || 'oo', true)
    return S.pluck(ctx, t, out, f, 0.3, stepDur * 2)
  }
}

// Play a full arrangement, genre-accurately. Walks every bar of the song,
// only sounding tracks that are active in the current section (and visible),
// using the genre's own groove table. Reports the global 16th-step index so
// the UI can move a playhead. Returns a transport with stop().
// `tracks` is a static list of { name, voice, sections }. clipsRef.current is
// a live map { trackName: clip16 } and mutedRef.current a live { name: true }
// map — both are read fresh every step so the user can swap example patterns
// and mute/unmute tracks while the song keeps playing.
export function playArrangement(genreId, arrangement, tracks, { onStep, startStep = 0, clipsRef, mutedRef, bpm: bpmOverride } = {}) {
  const ctx = getContext()
  const groove = grooveFor(genreId)
  const bpm = bpmOverride || groove.bpm
  const swing = groove.swing || 0

  const out = ctx.createGain()
  out.gain.value = 0.8
  out.connect(ctx.destination)

  // Map bar index → section index.
  const sections = arrangement.sections
  const barSection = []
  sections.forEach((s, si) => { for (let b = 0; b < s.bars; b++) barSection.push(si) })
  const totalBars = barSection.length
  const totalSteps = totalBars * 16
  const stepDur = 60 / bpm / 4

  let currentStep = ((startStep % totalSteps) + totalSteps) % totalSteps
  const startStepIndex = currentStep
  const startAudioTime = ctx.currentTime + 0.08
  let nextStepTime = startAudioTime
  let timer = null
  let stopped = false

  // Play a single pre-normalised clip event for a voice at a given time,
  // applying this genre's swing on the off-steps.
  function fire(voice, evt, stepInBar, time) {
    const t = time + (stepInBar % 2 === 1 ? swing * stepDur : 0)
    fireEvent(ctx, out, voice, evt, t, stepDur, genreId === 'deep-house')
  }

  function scheduler() {
    if (stopped) return
    const clips = clipsRef ? clipsRef.current : {}
    const muted = mutedRef ? mutedRef.current : {}
    while (nextStepTime < ctx.currentTime + 0.12) {
      const g = currentStep % totalSteps
      const bar = Math.floor(g / 16)
      const stepInBar = g % 16
      const sectionIdx = barSection[bar]

      // Lo-Fi vinyl crackle bed.
      if (genreId === 'lo-fi-hip-hop' && stepInBar % 8 === 0) {
        S.vinyl(ctx, nextStepTime, out, 0.03, stepDur * 8)
      }

      tracks.forEach(track => {
        if (muted[track.name]) return
        if (!track.sections[sectionIdx]) return
        const clip = clips[track.name]
        const evt = clip && clip[stepInBar]
        if (!evt) return
        fire(track.voice, evt, stepInBar, nextStepTime)
      })

      if (onStep) {
        const ms = (nextStepTime - ctx.currentTime) * 1000
        const s = g
        setTimeout(() => { if (!stopped) onStep(s) }, Math.max(0, ms))
      }

      nextStepTime += stepDur
      currentStep++
    }
    timer = setTimeout(scheduler, 25)
  }
  scheduler()

  return {
    totalSteps,
    // Audio-clock-accurate fractional position (0..1) for a smooth playhead.
    position() {
      const elapsed = ctx.currentTime - startAudioTime
      if (elapsed < 0) return (startStepIndex / totalSteps)
      const abs = (startStepIndex + elapsed / stepDur) % totalSteps
      return abs / totalSteps
    },
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      try { out.disconnect() } catch { /* already gone */ }
      if (onStep) onStep(-1)
    },
  }
}

// Play a user-built custom arrangement. Unlike playArrangement (one clip per
// track for the whole song), this plays a *different* clip per bar per track,
// so the user can paint distinct example patterns into each bar. gridRef is a
// live ref: gridRef.current = { trackName: [clip16 | null, ... per bar] }.
export function playCustom(tracks, bars, bpm, { onStep, gridRef, mutedRef, snareAsClap = false, startStep = 0 } = {}) {
  const ctx = getContext()
  const out = ctx.createGain()
  out.gain.value = 0.8
  out.connect(ctx.destination)

  const totalSteps = Math.max(16, bars * 16)
  const stepDur = 60 / bpm / 4

  let currentStep = ((startStep % totalSteps) + totalSteps) % totalSteps
  const startStepIndex = currentStep
  const startAudioTime = ctx.currentTime + 0.08
  let nextStepTime = startAudioTime
  let timer = null
  let stopped = false

  function scheduler() {
    if (stopped) return
    const grid = gridRef ? gridRef.current : {}
    const muted = mutedRef ? mutedRef.current : {}
    while (nextStepTime < ctx.currentTime + 0.12) {
      const gpos = currentStep % totalSteps
      const bar = Math.floor(gpos / 16)
      const stepInBar = gpos % 16

      tracks.forEach(track => {
        if (muted[track.name]) return
        const lane = grid[track.name]
        const clip = lane && lane[bar]
        const evt = clip && clip[stepInBar]
        if (!evt) return
        fireEvent(ctx, out, track.voice, evt, nextStepTime, stepDur, snareAsClap)
      })

      if (onStep) {
        const ms = (nextStepTime - ctx.currentTime) * 1000
        const s = gpos
        setTimeout(() => { if (!stopped) onStep(s) }, Math.max(0, ms))
      }

      nextStepTime += stepDur
      currentStep++
    }
    timer = setTimeout(scheduler, 25)
  }
  scheduler()

  return {
    totalSteps,
    position() {
      const elapsed = ctx.currentTime - startAudioTime
      if (elapsed < 0) return (startStepIndex / totalSteps)
      const abs = (startStepIndex + elapsed / stepDur) % totalSteps
      return abs / totalSteps
    },
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      try { out.disconnect() } catch { /* already gone */ }
      if (onStep) onStep(-1)
    },
  }
}

// Play a generic groove built from a set of instrument voices (for the
// arrangement "play" button). voices is an array of part names.
export function playGroove(voices, bpm, { onStep } = {}) {
  const ctx = getContext()
  const out = ctx.createGain()
  out.gain.value = 0.85
  out.connect(ctx.destination)

  const set = new Set(voices.map(voiceFor))
  const totalSteps = 16
  const stepDur = 60 / bpm / 4

  // Default one-bar groove per voice.
  const grooves = {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    eight08: [0, 6, 10],
    bass: [0, 3, 6, 8, 11, 14],
    break: [0, 3, 6, 10],
    chord: [2, 6, 10, 14],
    pluck: [0, 4, 8, 12],
  }
  const bassNotes = ['A1', 'A1', 'C2', 'E2']
  const chordFreqs = chordToFreqs('Am')

  let currentStep = 0
  let nextStepTime = ctx.currentTime + 0.1
  let timer = null
  let stopped = false

  function scheduler() {
    if (stopped) return
    while (nextStepTime < ctx.currentTime + 0.1) {
      const step = currentStep % totalSteps
      set.forEach(v => {
        if (!grooves[v]?.includes(step)) return
        if (v === 'kick') S.kick(ctx, nextStepTime, out, 0.9)
        else if (v === 'snare') S.snare(ctx, nextStepTime, out, 0.5)
        else if (v === 'hat') S.hat(ctx, nextStepTime, out, 0.3)
        else if (v === 'eight08') S.eight08(ctx, nextStepTime, out, noteToFreq('A1'))
        else if (v === 'bass') S.bass(ctx, nextStepTime, out, noteToFreq(bassNotes[step % bassNotes.length]))
        else if (v === 'break') (step % 8 < 4 ? S.kick : S.snare)(ctx, nextStepTime, out, 0.7)
        else if (v === 'chord') S.chordStab(ctx, nextStepTime, out, chordFreqs, 0.2, 0.4, true)
        else if (v === 'pluck') S.pluck(ctx, nextStepTime, out, chordFreqs[0] * 2)
      })

      if (onStep) {
        const t = (nextStepTime - ctx.currentTime) * 1000
        const s = step
        setTimeout(() => { if (!stopped) onStep(s) }, Math.max(0, t))
      }

      nextStepTime += stepDur
      currentStep++
    }
    timer = setTimeout(scheduler, 25)
  }
  scheduler()

  return {
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      try { out.disconnect() } catch { /* already gone */ }
      if (onStep) onStep(-1)
    },
  }
}
