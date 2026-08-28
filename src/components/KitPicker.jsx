import { useState, useEffect } from 'react'
import { KITS, getActiveKit, setActiveKit, onKitChange, loadKit } from '../audio/drumKit'

// Global drum-kit selector. The choice applies site-wide (arrangements, custom
// builder, generator) and persists in localStorage.
export default function KitPicker({ className = '' }) {
  const [kit, setKit] = useState(getActiveKit())
  useEffect(() => onKitChange(setKit), [])
  useEffect(() => { loadKit(getActiveKit()) }, []) // warm the current kit

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mr-1">Drum kit</span>
      {KITS.map(k => (
        <button
          key={k.id}
          onClick={() => setActiveKit(k.id)}
          className={`font-mono text-[11px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors duration-150 ${kit === k.id ? 'bg-acid text-base border-acid' : 'border-hairline text-dim hover:text-ink hover:border-dim'}`}
        >{k.label}</button>
      ))}
    </div>
  )
}
