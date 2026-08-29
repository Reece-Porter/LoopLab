import { useState, useEffect } from 'react'
import { KITS, getActiveKit, setActiveKit, onKitChange, loadKit } from '../audio/drumKit'
import { getInstrumentsMode, setInstrumentsMode, onInstrumentsChange, preloadInstruments } from '../audio/sampler'
import { getContext } from '../audio/synth'

// Global sound controls — a sampled drum kit and sampled melodic instruments
// (bass, keys, pads, leads). Choices apply site-wide and persist in localStorage.
export default function KitPicker({ className = '' }) {
  const [kit, setKit] = useState(getActiveKit())
  const [instr, setInstr] = useState(getInstrumentsMode())

  useEffect(() => onKitChange(setKit), [])
  useEffect(() => onInstrumentsChange(setInstr), [])
  useEffect(() => { loadKit(getActiveKit()) }, [])
  // Warm the melodic instruments in the background when in samples mode.
  useEffect(() => { if (getInstrumentsMode() === 'samples') preloadInstruments(getContext()) }, [])

  function chooseInstr(m) {
    setInstrumentsMode(m)
    if (m === 'samples') preloadInstruments(getContext())
  }

  const btn = (active) =>
    `font-mono text-[11px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors duration-150 ${active ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink hover:border-dim'}`

  return (
    <div className={`flex items-center gap-x-4 gap-y-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mr-1">Drums</span>
        {KITS.map(k => (
          <button key={k.id} onClick={() => setActiveKit(k.id)} className={btn(kit === k.id)}>{k.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mr-1">Instruments</span>
        <button onClick={() => chooseInstr('samples')} className={btn(instr === 'samples')}>Samples</button>
        <button onClick={() => chooseInstr('synth')} className={btn(instr === 'synth')}>Synth</button>
      </div>
    </div>
  )
}
