import { useState } from 'react'

export default function ArrangementView({ arrangement, accentClass }) {
  const [hidden, setHidden] = useState({})

  const toggleTrack = name =>
    setHidden(h => ({ ...h, [name]: !h[name] }))

  const totalBars = arrangement.sections.reduce((sum, s) => sum + s.bars, 0)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-base">🎼</span>
          <span className="text-sm font-semibold text-white">Arrangement View</span>
        </div>
        <span className="text-xs text-gray-600">{totalBars} bars total</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>

          {/* Section ruler */}
          <div className="flex border-b border-white/10 bg-white/5">
            <div className="w-36 shrink-0 px-3 py-1.5 text-xs text-gray-600 border-r border-white/10">Track</div>
            <div className="flex flex-1">
              {arrangement.sections.map((section, i) => (
                <div
                  key={i}
                  className="border-r border-white/10 px-1.5 py-1.5 text-xs text-gray-400 truncate"
                  style={{ flex: section.bars }}
                >
                  <span className="font-medium">{section.name}</span>
                  <span className="text-gray-600 ml-1">{section.bars}b</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {arrangement.tracks.map(track => {
            const isHidden = hidden[track.name]
            return (
              <div key={track.name} className={`flex border-b border-white/5 group ${isHidden ? 'opacity-40' : ''}`}>
                {/* Track label + toggle */}
                <button
                  onClick={() => toggleTrack(track.name)}
                  className="w-36 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-white/10 hover:bg-white/5 transition-colors text-left"
                  title={isHidden ? 'Show track' : 'Hide track'}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: track.color, opacity: isHidden ? 0.3 : 1 }}
                  />
                  <span className="text-xs text-gray-300 truncate">{track.icon} {track.name}</span>
                  <span className="ml-auto text-gray-700 group-hover:text-gray-500 text-xs shrink-0">
                    {isHidden ? '◻' : '◼'}
                  </span>
                </button>

                {/* Pattern blocks */}
                <div className="flex flex-1 py-1.5 px-0.5 gap-0.5 items-center bg-black/20">
                  {arrangement.sections.map((section, i) => (
                    <div
                      key={i}
                      className="rounded-sm h-6 border border-white/5 transition-opacity"
                      style={{
                        flex: section.bars,
                        backgroundColor: track.sections[i] && !isHidden ? track.color : 'transparent',
                        opacity: track.sections[i] ? (isHidden ? 0.2 : 0.75) : 0.1,
                        borderColor: track.sections[i] ? track.color + '40' : 'transparent'
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Bar counter */}
          <div className="flex border-t border-white/5 bg-black/20">
            <div className="w-36 shrink-0 border-r border-white/10" />
            <div className="flex flex-1 py-1">
              {arrangement.sections.map((section, i) => {
                const barsBefore = arrangement.sections.slice(0, i).reduce((s, x) => s + x.bars, 0)
                return (
                  <div key={i} className="border-r border-white/5 px-1" style={{ flex: section.bars }}>
                    <span className="text-xs text-gray-700">{barsBefore + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-white/5 flex gap-4 flex-wrap">
        <span className="text-xs text-gray-700">Click a track name to toggle it on/off</span>
        <button
          onClick={() => setHidden({})}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-auto"
        >
          Show all
        </button>
      </div>
    </div>
  )
}
