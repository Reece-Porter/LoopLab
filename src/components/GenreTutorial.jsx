import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: '🎤',
    title: 'Switch vocals to samples',
    desc: 'In the Full Arrangement section, hit the mic button to toggle between synth and real vocal samples.',
  },
  {
    icon: '🔗',
    title: 'Turn off arrangement follow',
    desc: 'The chain icon in the arrangement header locks the playhead view — tap it to let it scroll freely.',
  },
  {
    icon: '🎛️',
    title: 'Build your own arrangement',
    desc: 'Scroll down to "Build Your Own Arrangement" — drag parts into the timeline and paint your own structure.',
  },
  {
    icon: '🖱️',
    title: 'Select and paint bars',
    desc: 'Click a bar to toggle it on/off. Click and drag across multiple bars to paint them all at once.',
  },
  {
    icon: '⬇️',
    title: 'Export as MIDI',
    desc: 'Hit the MIDI button (↓ MIDI) in either the arrangement or custom builder to download a .mid file for FL Studio.',
  },
  {
    icon: '🔴',
    title: 'Record your vocals',
    desc: 'Use the Vocal Recorder at the bottom of the page to record a clip — it slots straight into your custom arrangement.',
  },
]

export default function GenreTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!sessionStorage.getItem('looplab-tutorial-seen')) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('looplab-tutorial-seen', '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={dismiss}>
      <div
        className="w-full max-w-sm bg-[#16161e] border border-white/[0.1] rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-600">Quick guide</span>
          <button onClick={dismiss} className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none">×</button>
        </div>

        {/* Step content */}
        <div className="mb-6">
          <div className="text-3xl mb-3">{current.icon}</div>
          <h3 className="text-white font-semibold text-base mb-2">{current.title}</h3>
          <p className="text-gray-400 text-[13px] leading-relaxed">{current.desc}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1 rounded-full transition-all duration-200 ${i === step ? 'bg-[#7c5cfc] w-6' : 'bg-white/[0.12] w-3 hover:bg-white/20'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={dismiss} className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">
            Skip all
          </button>
          <button
            onClick={next}
            className="bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {isLast ? 'Got it' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
