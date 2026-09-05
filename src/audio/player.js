// Sequencer — schedules a looping pattern using a lookahead scheduler and
// fires a callback so the UI can highlight the current step.

import { getContext } from './synth'
import * as S from './synth'
import { noteToFreq, chordToFreqs } from './theory'
import { grooveFor } from './grooves'
import { playKitVoice } from './drumKit'
import { playChordSampled, playFreqSampled, playRiser } from './sampler'

// Decide which synth voice a part uses, from its name.
export function voiceFor(partName) {
  const n = partName.toLowerCase()
  if (n.includes('drum')) return 'kick'   // e.g. "Drums" in lo-fi
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
  if (n.includes('reese') || (n.includes('mid') && n.includes('bass'))) return 'reese'
  if (n.includes('sub') || n.includes('bass')) return 'bass'
  if (n.includes('rumble')) return 'kick'
  if (n.includes('bell')) return 'bell'
  // Pad/chord/string/key takes precedence over atmos/fx so a "Pads/Atmos" track
  // plays the held pad chords rather than a riser (which the groove may not define).
  if (n.includes('string') || n.includes('chord') || n.includes('pad') || n.includes('key')) return 'chord'
  if (n.includes('fx') || n.includes('riser') || n.includes('atmos') || n.includes('texture')) return 'riser'
  if (n.includes('vocal') || n.includes('vox') || n.includes('voice') || n.includes('vocals')) return 'vox'
  if (n.includes('hoover') || n.includes('stab') || n.includes('rave') ||
      n.includes('acid')) return 'supersaw'
  if (n.includes('lead') && n.includes('synth')) return 'supersaw'  // "Lead Synth" → detuned supersaw
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
  // Recorded vocal clip or hardcoded sample — play the AudioBuffer directly.
  //   evt.rate       pitch-shift (so a one-shot can follow a hook melody)
  //   evt.gain       level trim
  //   evt.offset     start position into the buffer, in seconds (for chops)
  //   evt.gateSteps  gate length in steps — slices the sample into a short,
  //                  enveloped chop instead of playing it in full
  if (evt.vocalBuffer || evt.vocalClipId) {
    const buf = evt.vocalBuffer
    if (!buf) return // buffer not yet decoded / file missing, skip silently
    const src = ctx.createBufferSource()
    src.buffer = buf
    if (evt.rate && evt.rate > 0) src.playbackRate.value = evt.rate
    const peak = (evt.gain != null ? evt.gain : 1) * 0.85
    const off = evt.offset || 0
    const g = ctx.createGain()
    src.connect(g); g.connect(out)
    if (evt.gateSteps != null) {
      const dur = evt.gateSteps * stepDur
      const a = 0.006                       // tiny attack to avoid clicks
      const r = Math.min(0.06, dur * 0.4)   // short release tail
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(peak, t + a)
      g.gain.setValueAtTime(peak, Math.max(t + a, t + dur - r))
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.start(t, off)
      src.stop(t + dur + 0.05)
    } else {
      g.gain.value = peak
      src.start(t, off)
    }
    return
  }
  if (evt.drum) {
    const tone = evt.tone
    // Sampled kit first (when one is selected); falls back to the synth voices.
    // Trap hat rolls stay on the synth (fast retrigs sound wrong from one-shots).
    if (voice === 'kick') { if (playKitVoice(ctx, 'kick', t, out, 0.95)) return; return S.kick(ctx, t, out, 1, tone) }
    if (voice === 'clap') { if (playKitVoice(ctx, 'clap', t, out, 0.6)) return; return S.clap(ctx, t, out, 0.6) }
    if (voice === 'perc') {
      if (playKitVoice(ctx, 'perc', t, out, 0.5)) return
      if (tone === 'conga') return S.conga(ctx, t, out, 0.45, 200 + (evt.level || 0.5) * 80)
      return S.hat(ctx, t, out, 0.32, true, tone)
    }
    if (voice === 'snare') { if (playKitVoice(ctx, snareAsClap ? 'clap' : 'snare', t, out, 0.6)) return; return (snareAsClap ? S.clap : S.snare)(ctx, t, out, 0.6, tone) }
    if (voice === 'hat') {
      if (evt.roll) { // trap roll: fast retrigs filling the step (synth only)
        for (let r = 0; r < evt.roll; r++) S.hat(ctx, t + (r * stepDur) / evt.roll, out, 0.22, false, tone)
        return
      }
      if (playKitVoice(ctx, evt.open ? 'hatOpen' : 'hatClosed', t, out, 0.45)) return
      return S.hat(ctx, t, out, 0.3, !!evt.open, tone)
    }
    if (voice === 'break') {
      const isSnare = evt.breakSnare || (evt.breakStep != null && evt.breakStep % 8 >= 4)
      if (playKitVoice(ctx, isSnare ? 'snare' : 'kick', t, out, 0.85)) return
      return isSnare ? S.snare(ctx, t, out, 0.55, evt.tone || 'dnb') : S.kick(ctx, t, out, 0.9, evt.tone || 'dnb')
    }
    if (playKitVoice(ctx, 'kick', t, out, 0.95)) return
    return S.kick(ctx, t, out, 1, tone)
  }
  if (evt.freqs) {
    const vg = evt.gain != null ? evt.gain : 1 // per-pattern gain trim
    // Sampled instruments first (when in 'samples' mode and loaded); else synth.
    const chordInst = evt.organ ? 'organ' : (evt.rhodes || evt.keys) ? 'rhodes' : evt.pad ? 'ravepad' : evt.rave ? 'supersaw' : 'piano'
    // The lush string pad was sampled low (≤G3); fold chord tones down into its
    // range so octave-4 chords play warm instead of stretched thin.
    const chordFreqs = evt.pad ? evt.freqs.map(f => { let x = f; while (x > 210) x /= 2; return x }) : evt.freqs
    if (playChordSampled(ctx, chordInst, chordFreqs, t, out, 0.5 * vg, evt.pad ? stepDur * 10 : stepDur * 4)) return
    if (evt.organ) return S.organ(ctx, t, out, evt.freqs, 0.3 * vg, stepDur * 2.5)
    if (evt.rhodes) return S.rhodes(ctx, t, out, evt.freqs, 0.24 * vg, stepDur * 7)
    if (voice === 'piano') return S.piano(ctx, t, out, evt.freqs, 0.24 * vg, evt.pad ? stepDur * 8 : stepDur * 3)
    if (evt.pad) return S.synthPad(ctx, t, out, evt.freqs, 0.20 * vg, stepDur * 12)
    if (evt.rave) return S.supersawChord(ctx, t, out, evt.freqs, 0.13 * vg, stepDur * 3.2)
    if (evt.keys) return S.softKeys(ctx, t, out, evt.freqs, 0.17 * vg, stepDur * 6)
    return S.chordStab(ctx, t, out, evt.freqs, 0.18 * vg, stepDur * 4, true)
  }
  if (voice === 'riser') { if (playRiser(ctx, t, out, 0.5)) return; return S.riser(ctx, t, out, 0.14, stepDur * 64) }
  if (evt.freq != null) {
    const f = evt.freq
    // Sampled tonal voices first; else synth.
    const noteInst = evt.hoover ? 'hoover' : evt.acid ? 'acid'
      : (evt.sub || voice === 'bass') ? 'bass'
      : voice === 'reese' ? 'reese'
      : voice === 'eight08' ? 'moog'
      : voice === 'supersaw' ? 'ravelead'
      : voice === 'piano' ? 'piano' : null
    if (noteInst) {
      const g = (noteInst === 'bass' || noteInst === 'moog') ? 0.55 : noteInst === 'hoover' ? 0.32 : noteInst === 'ravelead' ? 0.34 : 0.42
      const isLongBass = voice === 'bass' || evt.sub || voice === 'eight08'
      const dur = isLongBass ? (evt.long ? stepDur * 5 : stepDur * 1.6) : stepDur * 1.9
      // The rave lead was sampled only up to B4; fold higher notes down an octave
      // so the top of a lead line stays real instead of chipmunking.
      let nf = f
      if (noteInst === 'ravelead') while (nf > 500) nf /= 2
      if (playFreqSampled(ctx, noteInst, nf, t, out, g, dur)) return
    }
    if (evt.bell) return S.bell(ctx, t, out, f, 0.32, stepDur * 10)
    if (evt.hoover) return S.hoover(ctx, t, out, f, 0.26, stepDur * 2.2)
    if (evt.acid) return S.acid(ctx, t, out, f, 0.38, stepDur * 1.7, evt.accent)
    if (evt.sub) return S.sub(ctx, t, out, f, 0.55, evt.long ? stepDur * 6 : stepDur * 2)
    if (voice === 'reese') return S.reese(ctx, t, out, f, 0.4, stepDur * 3)
    if (voice === 'donk') return S.donk(ctx, t, out, f, 0.5, stepDur * 1.4)
    if (voice === 'eight08') return S.eight08(ctx, t, out, f, 0.9, evt.long ? stepDur * 6 : 0.5)
    if (voice === 'bass') return S.bass(ctx, t, out, f, 0.5, evt.long ? stepDur * 4 : stepDur * 1.5)
    if (voice === 'supersaw') return S.supersaw(ctx, t, out, f, 0.28, stepDur * 1.8)
    if (voice === 'piano') return S.piano(ctx, t, out, [f], 0.22, stepDur * 3)
    if (voice === 'vox') {
      // Real sung vocal multisample (Cymatics) first; `synthVox` forces the synth
      // (the arrangement's Vocals: Synth toggle), and it's also the fallback.
      // Fold the written note into the sample's natural female range (~F3–F#4)
      // so a hook written up in octave 5 doesn't chipmunk.
      const vdur = stepDur * (evt.chop ? 1.6 : Math.min(8, evt.sustain || 4))
      let vf = f
      while (vf > 370) vf /= 2
      while (vf < 175) vf *= 2
      if (!evt.synthVox && playFreqSampled(ctx, 'vocal', vf, t, out, 0.5, vdur)) return
      if (evt.pluck) return S.pluck(ctx, t, out, f, 0.22, stepDur * 2)
      return S.vox(ctx, t, out, f, 0.15, stepDur * (evt.sustain || 5), evt.vowel || 'oo', false)
    }
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
export function playArrangement(genreId, arrangement, tracks, { onStep, startStep = 0, clipsRef, mutedRef, gainsRef, bpm: bpmOverride, vocalPhraseRef } = {}) {
  const ctx = getContext()
  const groove = grooveFor(genreId)
  const bpm = bpmOverride || groove.bpm
  const swing = groove.swing || 0

  const out = ctx.createGain()
  out.gain.value = 0.8
  out.connect(ctx.destination)

  // Per-track gain bus so each part has its own live volume fader.
  const trackOuts = {}
  function outFor(name) {
    let n = trackOuts[name]
    if (!n) { n = ctx.createGain(); n.connect(out); trackOuts[name] = n }
    const gains = gainsRef ? gainsRef.current : null
    const v = gains && gains[name] != null ? gains[name] : 1
    if (n.gain.value !== v) n.gain.value = v
    return n
  }

  // Map bar index → section index.
  const sections = arrangement.sections
  const barSection = []
  const sectionStartBar = []
  sections.forEach((s, si) => { sectionStartBar.push(barSection.length); for (let b = 0; b < s.bars; b++) barSection.push(si) })
  const totalBars = barSection.length

  // Sections that get the long sung-vocal phrase (drops + breakdowns), matched
  // by section name across the different structures — dance drops (Drop/Main),
  // pop choruses/hooks, and breakdowns (Break/Bridge). In these the phrase
  // replaces the per-note vocal; verses/builds keep the per-note vocal.
  const phraseSection = sections.map(s => /drop|main|break|chorus|hook|bridge/i.test(s.name || ''))
  const voxTrack = tracks.find(t => t.voice === 'vox')
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
  function fire(voice, evt, stepInBar, time, dest) {
    const t = time + (stepInBar % 2 === 1 ? swing * stepDur : 0)
    fireEvent(ctx, dest || out, voice, evt, t, stepDur, genreId === 'deep-house')
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

      // Long sung-vocal phrase over drops/breakdowns: KEY-LOCKED (pitched into
      // the genre's key by `semitones`), re-triggered to fill the section and
      // re-synced to the bar grid each time. Gated so it never spills past the
      // section end. Replaces the per-note vocal in these sections.
      const vp = vocalPhraseRef && vocalPhraseRef.current
      const phraseHere = vp && vp.buf && voxTrack && phraseSection[sectionIdx] && voxTrack.sections[sectionIdx]
      if (phraseHere && stepInBar === 0 && !muted[voxTrack.name]) {
        const rate = Math.pow(2, (vp.semitones || 0) / 12)
        const barSec = 16 * stepDur
        const audible = vp.buf.duration / rate                 // heard length in seconds
        const everyBars = Math.max(1, Math.round(audible / barSec))
        const local = bar - sectionStartBar[sectionIdx]
        if (local % everyBars === 0) {
          const secEnd = sectionStartBar[sectionIdx] + sections[sectionIdx].bars
          const dur = Math.min(audible, (secEnd - bar) * barSec)
          const src = ctx.createBufferSource()
          src.buffer = vp.buf
          src.playbackRate.value = rate
          const pg = ctx.createGain()
          pg.gain.setValueAtTime(0, nextStepTime)
          pg.gain.linearRampToValueAtTime(0.9, nextStepTime + 0.02)
          pg.gain.setValueAtTime(0.9, nextStepTime + Math.max(0.05, dur - 0.12))
          pg.gain.exponentialRampToValueAtTime(0.0001, nextStepTime + dur)
          src.connect(pg); pg.connect(outFor(voxTrack.name))
          src.start(nextStepTime); src.stop(nextStepTime + dur + 0.05)
        }
      }

      tracks.forEach(track => {
        if (muted[track.name]) return
        if (!track.sections[sectionIdx]) return
        // In drop/breakdown sections the phrase covers the vocal, so mute the
        // per-note vox there (it still sings in builds and other sections).
        if (track.voice === 'vox' && phraseHere) return
        const clip = clips[track.name]
        // Index by GLOBAL step modulo this clip's own length, so a 16-step clip
        // loops every bar while a 32/64-step phrase evolves over 2/4 bars — all
        // phase-locked to the song grid.
        const evt = clip && clip[g % clip.length]
        if (!evt) return
        fire(track.voice, evt, stepInBar, nextStepTime, outFor(track.name))
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
export function playCustom(tracks, bars, bpm, { onStep, gridRef, mutedRef, gainsRef, snareAsClap = false, startStep = 0 } = {}) {
  const ctx = getContext()
  const out = ctx.createGain()
  out.gain.value = 0.8
  out.connect(ctx.destination)

  // Per-track gain bus so each lane has its own live volume fader.
  const trackOuts = {}
  function outFor(name) {
    let n = trackOuts[name]
    if (!n) { n = ctx.createGain(); n.connect(out); trackOuts[name] = n }
    const gains = gainsRef ? gainsRef.current : null
    const v = gains && gains[name] != null ? gains[name] : 1
    if (n.gain.value !== v) n.gain.value = v
    return n
  }

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
        fireEvent(ctx, outFor(track.name), track.voice, evt, nextStepTime, stepDur, snareAsClap)
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
