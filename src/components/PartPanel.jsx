import { useState, useEffect } from 'react'
import { usePlayer } from '../audio/usePlayer'
import { parseBpm } from '../audio/theory'
import PlayButton from './PlayButton'

export default function PartPanel({ part, accentClass, bpm }) {
  const [selected, setSelected] = useState(0)

  // Reset selection when switching parts.
  useEffect(() => { setSelected(0) }, [part.name])

  const pattern = part.patterns[selected] || part.patterns[0]
  const numericBpm = parseBpm(bpm)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tips column */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-1">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">{part.icon}</span> {part.name}
        </h3>
        <ul className="space-y-3">
          {part.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${accentClass} shrink-0`} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Pattern column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Pattern selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">
              Example pattern ({part.patterns.length} options)
            </label>
            <select
              value={selected}
              onChange={e => setSelected(Number(e.target.value))}
              className="w-full bg-gray-900 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {part.patterns.map((p, i) => (
                <option key={i} value={i}>{p.name}  ·  {typeLabel(p.type)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pattern display */}
        <PatternDisplay
          pattern={pattern}
          accentClass={accentClass}
          partName={part.name}
          bpm={numericBpm}
          patternIndex={selected}
        />
      </div>
    </div>
  )
}

function typeLabel(type) {
  return { steps: 'Step sequence', notes: 'Melody', chords: 'Chords', structure: 'Arrangement' }[type] || type
}

function PatternDisplay({ pattern, accentClass, partName, bpm, patternIndex }) {
  const id = `${partName}-${patternIndex}`
  const { playing, step, toggle } = usePlayer(id)

  const playable = pattern.type !== 'structure'

  const onPlay = () => toggle('pattern', { pattern, partName, bpm, withClick: true })

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-semibold text-white">{pattern.name}</p>
          <p className="text-xs text-gray-500">{typeLabel(pattern.type)} · {bpm} BPM</p>
        </div>
        {playable && (
          <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} />
        )}
      </div>

      {pattern.type === 'steps' && <StepGrid steps={pattern.steps} accentClass={accentClass} activeStep={step} />}
      {pattern.type === 'notes' && <NoteGrid value={pattern.value} accentClass={accentClass} activeStep={step} />}
      {pattern.type === 'chords' && <ChordGrid value={pattern.value} accentClass={accentClass} activeStep={step} />}
      {pattern.type === 'structure' && <StructurePattern value={pattern.value} />}
    </div>
  )
}

// ---- Step grid: 4 beats × 4 sixteenths, beat-accurate ----
function StepGrid({ steps, accentClass, activeStep }) {
  const beats = []
  for (let b = 0; b < Math.ceil(steps.length / 4); b++) {
    beats.push(steps.slice(b * 4, b * 4 + 4))
  }
  return (
    <div>
      <div className="flex gap-3">
        {beats.map((beat, bi) => (
          <div key={bi} className="flex-1">
            <div className="text-xs text-gray-500 mb-1.5 font-mono">Beat {bi + 1}</div>
            <div className="flex gap-1.5">
              {beat.map((s, si) => {
                const stepNum = bi * 4 + si
                const isActive = activeStep === stepNum
                return (
                  <div
                    key={si}
                    className={`flex-1 rounded-md h-16 flex items-end justify-center pb-1 transition-all duration-75 ${
                      s === 2
                        ? `bg-gradient-to-b ${accentClass} opacity-70`
                        : s === 1
                        ? `bg-gradient-to-b ${accentClass}`
                        : 'bg-white/5 border border-white/5'
                    } ${isActive ? 'ring-2 ring-white scale-105' : ''}`}
                  >
                    <span className={`text-[10px] font-mono ${s ? 'text-white/70' : 'text-gray-600'}`}>
                      {si === 0 ? bi + 1 : si === 2 ? '&' : '·'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {steps.some(s => s === 2) && (
        <p className="text-xs text-gray-600 mt-3">Lighter shade = open hi-hat</p>
      )}
    </div>
  )
}

// ---- Note grid ----
function NoteGrid({ value, accentClass, activeStep }) {
  const tokens = value.split(/\s+/)
  // Map display index → playable step index (excludes arrows).
  let stepCounter = -1
  const mapped = tokens.map(tok => {
    if (tok === '→') return { tok, step: null, arrow: true }
    stepCounter++
    return { tok, step: stepCounter, rest: tok === '–' }
  })
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {mapped.map((m, i) => {
          if (m.arrow) return <span key={i} className="px-1 py-2 text-purple-400 font-mono text-sm self-center">→</span>
          const isActive = activeStep === m.step
          return (
            <span
              key={i}
              className={`px-3 py-2.5 rounded-md text-sm font-mono min-w-[42px] text-center transition-all duration-75 ${
                m.rest
                  ? 'text-gray-700 bg-white/[0.03]'
                  : `bg-gradient-to-b ${accentClass} text-white`
              } ${isActive ? 'ring-2 ring-white scale-110' : ''}`}
            >
              {m.tok}
            </span>
          )
        })}
      </div>
      <p className="text-xs text-gray-600 mt-3">Each cell = one 8th-note step (– = rest, → = slide)</p>
    </div>
  )
}

// ---- Chord grid ----
function ChordGrid({ value, accentClass, activeStep }) {
  const chords = value.replace(/\(.*?\)/g, '').split(/\s+–\s+/).map(c => c.trim()).filter(Boolean)
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {chords.map((chord, i) => {
          const isActive = activeStep === i
          return (
            <span
              key={i}
              className={`px-5 py-3 rounded-lg text-base font-semibold font-mono transition-all duration-75 ${
                isActive ? `bg-gradient-to-b ${accentClass} text-white ring-2 ring-white scale-105` : 'bg-white/10 text-gray-200'
              }`}
            >
              {chord}
            </span>
          )
        })}
      </div>
      <p className="text-xs text-gray-600 mt-3">Each chord plays for one beat · loops</p>
    </div>
  )
}

function StructurePattern({ value }) {
  const sections = value.split(/\s*→\s*/)
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {sections.map((section, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="px-3 py-2 rounded-lg bg-white/10 text-sm text-gray-300">{section.trim()}</span>
          {i < sections.length - 1 && (
            <svg className="w-3 h-3 text-gray-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}
