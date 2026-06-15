import { useState, useEffect, useCallback, useRef } from 'react'

const STEPS = [
  {
    target: 'sample-toggle',
    title: 'Switch to real vocal samples',
    desc: 'Toggle between synthesised vocals and real recorded samples. When a sample loads, this lights up green.',
    position: 'below',
  },
  {
    target: 'follow-toggle',
    title: 'Arrangement follow',
    desc: 'When locked, the view tracks the playhead as it moves. Turn it off to scroll and edit freely while the arrangement plays.',
    position: 'below',
  },
  {
    target: 'midi-export',
    title: 'Download as MIDI',
    desc: 'Exports the groove as a .mid file. Drag it straight into FL Studio to use the patterns in your project.',
    position: 'below',
  },
  {
    target: 'bar-grid',
    title: 'Click and drag to paint bars',
    desc: 'Click a bar to place a pattern, drag across multiple bars to fill them all at once. Right-click to erase.',
    position: 'above',
  },
  {
    target: 'custom-midi',
    title: 'Export your arrangement as MIDI',
    desc: 'Downloads your custom arrangement as MIDI — each part on its own track, ready for FL Studio.',
    position: 'above',
  },
  {
    target: 'vocal-recorder',
    title: 'Record vocals',
    desc: 'Record a vocal clip from your mic. It saves here and slots into the custom arrangement grid as its own lane.',
    position: 'above',
  },
]

const PAD = 10 // spotlight padding around target

export default function GenreTutorial() {
  const [step, setStep] = useState(-1) // -1 = not started / hidden
  const [rect, setRect] = useState(null)
  const tooltipRef = useRef(null)

  const findRect = useCallback((target) => {
    const el = document.querySelector(`[data-tutorial="${target}"]`)
    if (!el) return null
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Wait for scroll to settle before measuring
    return new Promise(resolve => {
      setTimeout(() => {
        const r = el.getBoundingClientRect()
        resolve({
          top: r.top + window.scrollY - PAD,
          left: r.left + window.scrollX - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
          // viewport position for tooltip
          vtop: r.top,
          vleft: r.left,
          vwidth: r.width,
          vheight: r.height,
        })
      }, 500)
    })
  }, [])

  // Show tutorial on first genre open this session
  useEffect(() => {
    if (!sessionStorage.getItem('looplab-tutorial-seen')) {
      setStep(0)
    }
  }, [])

  // When step changes, find and measure the target element
  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return
    findRect(STEPS[step].target).then(r => {
      if (r) setRect(r)
    })
  }, [step, findRect])

  function dismiss() {
    sessionStorage.setItem('looplab-tutorial-seen', '1')
    setStep(-1)
    setRect(null)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  if (step < 0) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Tooltip viewport positioning
  let tooltipStyle = {}
  if (rect) {
    const below = current.position !== 'above'
    const tooltipH = 160
    const margin = 12
    if (below) {
      tooltipStyle = {
        top: rect.vtop + rect.vheight + margin,
        left: Math.min(
          Math.max(8, rect.vleft + rect.vwidth / 2 - 160),
          window.innerWidth - 336
        ),
      }
    } else {
      tooltipStyle = {
        top: rect.vtop - tooltipH - margin,
        left: Math.min(
          Math.max(8, rect.vleft + rect.vwidth / 2 - 160),
          window.innerWidth - 336
        ),
      }
    }
  }

  return (
    <>
      {/* Dark overlay with spotlight hole */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-40 pointer-events-none rounded-lg"
          style={{
            top: rect.vtop - PAD,
            left: rect.vleft - PAD,
            width: rect.vwidth + PAD * 2,
            height: rect.vheight + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            border: '1.5px solid rgba(124,92,252,0.7)',
            background: 'transparent',
          }}
        />
      )}

      {/* Click-to-dismiss backdrop */}
      <div className="fixed inset-0 z-40" onClick={dismiss} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-80 bg-[#1a1a28] border border-[#7c5cfc]/40 rounded-xl shadow-2xl p-4 pointer-events-auto"
        style={rect ? tooltipStyle : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step label */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#7c5cfc]">
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={dismiss} className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none">×</button>
        </div>

        <h3 className="text-white font-semibold text-[14px] mb-1.5 leading-snug">{current.title}</h3>
        <p className="text-gray-400 text-[12px] leading-relaxed mb-4">{current.desc}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1 rounded-full transition-all duration-200 ${i === step ? 'bg-[#7c5cfc] w-5' : 'bg-white/[0.12] w-2.5 hover:bg-white/25'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={prev} className="text-[12px] text-gray-500 hover:text-gray-300 transition-colors">← Back</button>
            )}
            <button onClick={dismiss} className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">Skip</button>
          </div>
          <button
            onClick={next}
            className="bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white text-[12px] font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
