import { useState, useEffect, useRef, useCallback } from 'react'
import { playPattern, playGroove, playArrangement } from './player'

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

  const toggle = useCallback((kind, args) => {
    if (activeId === idRef.current) {
      stopActive()
      return
    }
    stopActive()
    const onStep = s => setStep(s)
    if (kind === 'arrangement') {
      activeTransport = playArrangement(args.genreId, args.arrangement, args.tracks, { onStep })
    } else if (kind === 'groove') {
      activeTransport = playGroove(args.voices, args.bpm, { onStep })
    } else {
      activeTransport = playPattern(args.pattern, args.partName, args.bpm, { onStep, withClick: args.withClick })
    }
    activeId = idRef.current
    setPlaying(true)
    listeners.forEach(l => l(idRef.current))
  }, [])

  return { playing, step, toggle }
}
