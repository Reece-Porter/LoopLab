export default function PartPanel({ part, accentClass }) {
  return (
    <div className="space-y-6">
      {/* Tips */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>{part.icon}</span> {part.name} — Tips
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

      {/* Patterns */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Example Patterns</h3>
        <div className="space-y-4">
          {part.patterns.map((pattern, i) => (
            <PatternCard key={i} pattern={pattern} accentClass={accentClass} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PatternCard({ pattern, accentClass }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white mb-3">{pattern.name}</p>
      {pattern.type === 'steps' && <StepGrid steps={pattern.steps} accentClass={accentClass} />}
      {pattern.type === 'notes' && <NotePattern value={pattern.value} />}
      {pattern.type === 'chords' && <ChordPattern value={pattern.value} />}
      {pattern.type === 'structure' && <StructurePattern value={pattern.value} />}
    </div>
  )
}

function StepGrid({ steps, accentClass }) {
  return (
    <div>
      <div className="flex gap-1 mb-1">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex-1 rounded h-8 transition-colors ${
              s === 2
                ? `bg-gradient-to-b ${accentClass} opacity-60`
                : s === 1
                ? `bg-gradient-to-b ${accentClass}`
                : 'bg-white/10'
            } ${(i + 1) % 4 === 0 && i !== steps.length - 1 ? 'mr-1' : ''}`}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`flex-1 text-center text-xs ${(i % 4 === 0) ? 'text-gray-500' : 'text-transparent'} ${(i + 1) % 4 === 0 && i !== steps.length - 1 ? 'mr-1' : ''}`}>
            {i % 4 === 0 ? i / 4 + 1 : '.'}
          </div>
        ))}
      </div>
      {steps.some(s => s === 2) && (
        <p className="text-xs text-gray-600 mt-2">Lighter shade = open hi-hat</p>
      )}
    </div>
  )
}

function NotePattern({ value }) {
  const notes = value.split(/\s+–\s+|\s+→\s+/).flatMap(chunk => chunk.split(/\s+/))
  const raw = value
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {raw.split(' ').map((token, i) => {
          const isDash = token === '–' || token === '→'
          const isArrow = token === '→'
          return (
            <span
              key={i}
              className={`px-2 py-1 rounded text-xs font-mono ${
                isDash
                  ? isArrow ? 'text-purple-400' : 'text-gray-700'
                  : 'bg-white/10 text-gray-200'
              }`}
            >
              {token}
            </span>
          )
        })}
      </div>
      <p className="text-xs text-gray-600">Each token = 1 step (– = rest, → = slide/glide)</p>
    </div>
  )
}

function ChordPattern({ value }) {
  const chords = value.split(/\s+–\s+/)
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {chords.map((chord, i) => (
          <span key={i} className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-semibold text-gray-200 font-mono">
            {chord.trim()}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-600">Play each chord for 1–2 bars, loop the sequence</p>
    </div>
  )
}

function StructurePattern({ value }) {
  const sections = value.split(/\s*→\s*/)
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-gray-300">{section.trim()}</span>
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
