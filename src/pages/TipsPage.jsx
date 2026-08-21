import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// FL Studio shortcuts & workflow tips. Pure static reference content.
const SHORTCUTS = [
  {
    group: 'Transport & Playback',
    items: [
      ['Space', 'Play / Stop'],
      ['Ctrl + Space', 'Play from the playlist marker'],
      ['L', 'Toggle Pattern / Song mode'],
      ['Backspace', 'Toggle step-skip / snap on the playhead'],
      ['Ctrl + H', 'Re-arrange windows (panic / tidy)'],
    ],
  },
  {
    group: 'Editing',
    items: [
      ['Ctrl + Z / Ctrl + Shift + Z', 'Undo / Redo'],
      ['Ctrl + C / Ctrl + V', 'Copy / Paste notes or clips'],
      ['Ctrl + B', 'Duplicate the selection (great for doubling loops)'],
      ['Ctrl + L', 'Quick-quantise selected notes to the grid'],
      ['Alt + drag', 'Move a note/clip ignoring snap (fine control)'],
      ['Ctrl + A', 'Select all'],
    ],
  },
  {
    group: 'Channel Rack & Mixer',
    items: [
      ['F5', 'Open / close the Playlist'],
      ['F6', 'Open / close the Channel Rack'],
      ['F7', 'Open / close the Piano Roll'],
      ['F9', 'Open / close the Mixer'],
      ['Ctrl + L (on a channel)', 'Link the selected channel to the next free mixer track'],
      ['Alt + drag a knob', 'Create an automation clip from any parameter'],
    ],
  },
  {
    group: 'Piano Roll',
    items: [
      ['Ctrl + Up / Down', 'Shift selected notes by an octave'],
      ['Shift + Up / Down', 'Shift selected notes by a semitone'],
      ['Alt + S', 'Open the strum / chord tools'],
      ['Ctrl + U', 'Make unique (split a shared pattern)'],
      ['Shift + C', 'Chop / slice tool'],
    ],
  },
]

const WORKFLOW = [
  {
    title: 'Mixing & Levelling',
    icon: '🎚️',
    tips: [
      'Gain-stage first: aim for each channel peaking around -6 dB before adding plugins.',
      'Sidechain bass and pads to the kick (use Fruity Limiter or a sidechain compressor) for that pumping club feel.',
      'High-pass everything that is not a kick or bass to clear mud below ~120 Hz.',
      'Use Fruity Parametric EQ 2 and solo bands to hunt harsh resonances.',
      'Reference a commercial track in the same genre at the same loudness while you mix.',
    ],
  },
  {
    title: 'Arrangement & Workflow',
    icon: '🧩',
    tips: [
      'Build in 8 and 16-bar phrases — it keeps tracks DJ-friendly and easy to mix.',
      'Make a "drums only" pattern and a "music only" pattern, then combine them in the playlist.',
      'Use the playlist "Picker Panel" (left edge) to drag pattern clips in quickly.',
      'Colour-code and name every channel and clip — future-you will thank you.',
      'Save a template project with your favourite mixer routing, EQs and a tuned kick.',
    ],
  },
  {
    title: 'Sound Design',
    icon: '🛠️',
    tips: [
      'Sytrus and Harmor are FL\'s most powerful built-in synths — great for hoovers and leads.',
      'Layer a sine sub under any bass and tune it to the root note for weight.',
      'Use the Gross Beat plugin for stutters, gating and that "vinyl stop" effect.',
      'Add subtle saturation (Fruity Soft Clipper / Blood Overdrive) to glue drums.',
      'Automate a lowpass filter cutoff over 16 bars to build tension into a drop.',
    ],
  },
]

export default function TipsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()

  const groups = SHORTCUTS.map(g => ({
    ...g,
    items: g.items.filter(([k, v]) => !q || k.toLowerCase().includes(q) || v.toLowerCase().includes(q)),
  })).filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-base/80 border-b border-hairline">
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-dim hover:text-acid transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Home
          </button>
          <div className="w-11 h-11 bg-surface-2 border border-hairline flex items-center justify-center text-2xl">⌨️</div>
          <div>
            <h1 className="font-display uppercase tracking-[0.02em] text-xl font-bold text-ink">FL Studio Tips & Shortcuts</h1>
            <p className="text-xs text-dim">Keyboard shortcuts and workflow tricks that make producing faster</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-8">
        <div className="relative mb-8 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" /></svg>
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface-2 border border-hairline pl-11 pr-4 py-3 text-ink placeholder-faint focus:border-acid transition-colors duration-150"
          />
        </div>

        <h2 className="font-mono text-xs text-dim uppercase tracking-[0.16em] mb-4">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {groups.map(group => (
            <div key={group.group} className="border border-hairline bg-surface p-5">
              <h3 className="font-display uppercase tracking-[0.02em] text-base font-bold mb-4 text-ink">{group.group}</h3>
              <ul className="space-y-2.5">
                {group.items.map(([key, desc]) => (
                  <li key={key} className="flex items-start justify-between gap-3 text-sm">
                    <kbd className="font-mono text-xs uppercase tracking-[0.08em] bg-surface-2 border border-hairline px-2 py-1 text-ink shrink-0 whitespace-nowrap">{key}</kbd>
                    <span className="text-dim text-right">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-faint col-span-full text-center py-10">No shortcuts match &ldquo;{query}&rdquo;</p>
          )}
        </div>

        <h2 className="font-mono text-xs text-dim uppercase tracking-[0.16em] mb-4">Workflow & Production Tips</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {WORKFLOW.map(card => (
            <div key={card.title} className="border border-hairline bg-surface p-5">
              <h3 className="font-display uppercase tracking-[0.02em] text-base font-bold mb-4 flex items-center gap-2 text-ink">
                <span className="text-xl">{card.icon}</span> {card.title}
              </h3>
              <ul className="space-y-3">
                {card.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-dim leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-acid shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
