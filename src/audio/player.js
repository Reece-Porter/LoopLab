// Sequencer — schedules a looping pattern using a lookahead scheduler and
// fires a callback so the UI can highlight the current step.

import { getContext } from './synth'
import * as S from './synth'
import { noteToFreq, chordToFreqs } from './theory'

// Decide which synth voice a part uses, from its name.
export function voiceFor(partName) {
  const n = partName.toLowerCase()
  if (n.includes('808')) return 'eight08'
  if (n.includes('kick')) return 'kick'
  if (n.includes('snare') || n.includes('clap')) return 'snare'
  if (n.includes('hat') || n.includes('hi-hat')) return 'hat'
  if (n.includes('break')) return 'break'
  if (n.includes('sub') || n.includes('bass')) return 'bass'
  if (n.includes('chord') || n.includes('pad')) return 'chord'
  if (n.includes('lead') || n.includes('melody') || n.includes('synth') ||
      n.includes('vocal') || n.includes('sample')) return 'pluck'
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
