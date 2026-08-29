import { useState, useEffect, useCallback, useRef } from 'react'

const STEPS = [
  {
    target: 'bpm-slider',
    title: 'Tempo control',
    desc: "Drag the slider to change the BPM in real time. Hit reset to snap back to the genre's typical tempo.",
    position: 'below',
  },
  {
    target: 'sample-toggle',
    title: 'Switch to real vocal samples',
    desc: 'Toggle between synthesised vocals and real recorded samples. Lights up green when a sample is loaded.',
    position: 'below',
  },
  {
    target: 'follow-toggle',
    title: 'Arrangement follow',
    desc: 'When locked, the view tracks the playhead. Turn it off to scroll and edit freely while playing.',
    position: 'below',
  },
  {
    target: 'midi-export',
    title: 'Download as MIDI',
    desc: 'Exports the groove as a .mid file — drag it straight into FL Studio.',
    position: 'below',
  },
  {
    target: 'bar-grid',
    title: 'Paint your arrangement',
    desc: 'Click a bar to place a pattern, drag across multiple bars to fill them all at once. Right-click to erase.',
    position: 'above',
  },
  {
    target: 'custom-midi',
    title: 'Export your arrangement as MIDI',
    desc: 'Downloads your custom arrangement as a .mid file — each part on its own track, ready for FL Studio.',
    position: 'above',
  },
  {
    target: 'vocal-recorder',
    title: 'Record vocals',
    desc: 'Record from your mic. The clip saves here and slots into the arrangement grid as its own lane.',
    position: 'above',
  },
]

const PAD = 6

export default function GenreTutorial() {
  const [step, setStep] = useState(-1)
  const [spotlight, setSpotlight] = useState(null) // { top, left, width, height } in viewport px
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!sessionStorage.getItem('looplab-tutorial-seen')) {
      // Small delay so the page has rendered
      setTimeout(() => setStep(0), 600)
    }
  }, [])

  const measureTarget = useCallback(async (target) => {
    const el = document.querySelector(`[data-tutorial="${target}"]`)
    if (!el) return null
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Wait for scroll to finish, then measure viewport position
    await new Promise(r => setTimeout(r, 650))
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }, [])

  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return
    setSpotlight(null)
    measureTarget(STEPS[step].target).then(r => {
      if (r) setSpotlight(r)
    })
  }, [step, measureTarget])

  function dismiss() {
    sessionStorage.setItem('looplab-tutorial-seen', '1')
    setStep(-1)
    setSpotlight(null)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  if (step < 0) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Position tooltip above or below the spotlight box
  let tooltipStyle = { position: 'fixed', zIndex: 51, width: 300 }
  if (spotlight) {
    const margin = 10
    const cx = Math.min(
      Math.max(8, spotlight.left + spotlight.width / 2 - 150),
      window.innerWidth - 316
    )
    if (current.position === 'below') {
      tooltipStyle.top = spotlight.top + spotlight.height + PAD + margin
      tooltipStyle.left = cx
    } else {
      tooltipStyle.bottom = window.innerHeight - (spotlight.top - PAD - margin)
      tooltipStyle.left = cx
    }
  } else {
    // Centred fallback while measuring
    tooltipStyle.top = '50%'
    tooltipStyle.left = '50%'
    tooltipStyle.transform = 'translate(-50%,-50%)'
  }

  return (
    <>
      {/* Subtle overlay — not blacking out, just tinting */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Spotlight: transparent box with shadow eating the overlay */}
      {spotlight && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            top:    spotlight.top    - PAD,
            left:   spotlight.left   - PAD,
            width:  spotlight.width  + PAD * 2,
            height: spotlight.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            outline: '1.5px solid rgba(198,242,78,0.85)',
          }}
        />
      )}

      {/* Dismiss on backdrop click */}
      <div className="fixed inset-0 z-40" onClick={dismiss} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-auto z-50 bg-surface border border-hairline shadow-2xl p-4"
        style={tooltipStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">
            {step + 1} / {STEPS.length}
          </span>
          <button onClick={dismiss} className="text-faint hover:text-dim transition-colors leading-none text-lg">×</button>
        </div>

        <h3 className="font-display font-bold uppercase tracking-wide text-ink text-[13px] mb-1.5 leading-snug">{current.title}</h3>
        <p className="text-dim text-[12px] leading-relaxed mb-3">{current.desc}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1 rounded-full transition-all duration-200 ${i === step ? 'bg-acid w-5' : 'bg-white/[0.15] w-2.5 hover:bg-white/30'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={prev} className="text-[11px] text-dim hover:text-dim transition-colors">← Back</button>
            )}
            <button onClick={dismiss} className="text-[11px] text-faint hover:text-dim transition-colors">Skip all</button>
          </div>
          <button
            onClick={next}
            className="bg-acid hover:bg-acid-dim text-base font-mono uppercase tracking-[0.1em] text-[11px] px-4 py-1.5 transition-colors duration-150"
          >
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
