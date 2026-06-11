import { useState, useEffect, useRef, useCallback } from 'react'
import { playPattern, playGroove, playArrangement, playCustom } from './player'

// A single shared transport so only one sound plays at a time across the page.
let activeTransport = null
let activeId = null
const listeners = new Set()

function stopActive() {
  if (activeTransport) {
    activeTransport.stop()
    activeTransport = null
  }
  const prev = activeId
  activeId = null
  if (prev) listeners.forEach(l => l(null))
}

// Stop whatever is currently playing (used by the global spacebar shortcut).
export function stopAllPlayback() {
  stopActive()
}

export function usePlayer(id) {
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  const idRef = useRef(id)
  idRef.current = id

  useEffect(() => {
    const listener = current => {
      setPlaying(current === idRef.current)
      if (current !== idRef.current) setStep(-1)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (activeId === idRef.current) stopActive()
    }
  }, [])

  const start = useCallback((kind, args) => {
    stopActive()
    const onStep = s => setStep(s)
    if (kind === 'arrangement') {
      activeTransport = playArrangement(args.genreId, args.arrangement, args.tracks, {
        onStep, startStep: args.startStep, clipsRef: args.clipsRef, mutedRef: args.mutedRef, bpm: args.bpm,
      })
    } else if (kind === 'custom') {
      activeTransport = playCustom(args.tracks, args.bars, args.bpm, {
        onStep, gridRef: args.gridRef, mutedRef: args.mutedRef,
        snareAsClap: args.snareAsClap, startStep: args.startStep,
      })
    } else if (kind === 'groove') {
      activeTransport = playGroove(args.voices, args.bpm, { onStep })
    } else {
      activeTransport = playPattern(args.pattern, args.partName, args.bpm, { onStep, withClick: args.withClick })
    }
    activeId = idRef.current
    setPlaying(true)
    listeners.forEach(l => l(idRef.current))
  }, [])

  const stop = useCallback(() => {
    if (activeId === idRef.current) stopActive()
  }, [])

  // Audio-clock position (0..1) for the active transport, or null.
  const getPosition = useCallback(() => {
    if (activeId !== idRef.current || !activeTransport?.position) return null
    return activeTransport.position()
  }, [])

  const toggle = useCallback((kind, args) => {
    if (activeId === idRef.current) {
      stopActive()
      return
    }
    start(kind, args)
  }, [start])

  return { playing, step, toggle, start, stop, getPosition }
}
