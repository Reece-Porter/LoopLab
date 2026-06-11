import { useState } from 'react'
import { usePlayer } from '../audio/usePlayer'
import PlayButton from './PlayButton'

export default function ArrangementView({ arrangement, accentClass, bpm }) {
  const [hidden, setHidden] = useState({})
  const { playing, toggle } = usePlayer('arrangement')

  const toggleTrack = name =>
    setHidden(h => ({ ...h, [name]: !h[name] }))

  const totalBars = arrangement.sections.reduce((sum, s) => sum + s.bars, 0)
  const visibleTracks = arrangement.tracks.filter(t => !hidden[t.name])

  const onPlay = () =>
    toggle('groove', { voices: visibleTracks.map(t => t.name), bpm })

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎼</span>
          <div>
            <span className="text-base font-semibold text-white">Arrangement</span>
            <span className="text-xs text-gray-600 ml-2">{totalBars} bars · {bpm} BPM</span>
          </div>
        </div>
        <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} label="Play groove" />
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '760px' }}>

          {/* Section ruler */}
          <div className="flex border-b border-white/10 bg-white/5">
            <div className="w-44 shrink-0 px-4 py-2.5 text-xs text-gray-500 border-r border-white/10 font-semibold uppercase tracking-wider">
              Track
            </div>
            <div className="flex flex-1">
              {arrangement.sections.map((section, i) => (
                <div
                  key={i}
                  className="border-r border-white/10 px-2 py-2.5 text-center"
                  style={{ flex: section.bars }}
                >
                  <div className="text-xs font-semibold text-gray-300 truncate">{section.name}</div>
                  <div className="text-[10px] text-gray-600">{section.bars} bars</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {arrangement.tracks.map(track => {
            const isHidden = hidden[track.name]
            return (
              <div key={track.name} className={`flex border-b border-white/5 group ${isHidden ? 'opacity-40' : ''}`}>
                <button
                  onClick={() => toggleTrack(track.name)}
                  className="w-44 shrink-0 flex items-center gap-2.5 px-4 py-3.5 border-r border-white/10 hover:bg-white/5 transition-colors text-left"
                  title={isHidden ? 'Show track' : 'Hide track'}
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: track.color, opacity: isHidden ? 0.3 : 1 }}
                  />
                  <span className="text-sm text-gray-300 truncate">{track.icon} {track.name}</span>
                  <span className="ml-auto text-gray-700 group-hover:text-gray-500 text-sm shrink-0">
                    {isHidden ? '○' : '●'}
                  </span>
                </button>

                {/* Pattern blocks */}
                <div className="flex flex-1 py-2 px-1 gap-1 items-center bg-black/20">
                  {arrangement.sections.map((section, i) => (
                    <div
                      key={i}
                      className="rounded h-10 border transition-opacity flex items-center justify-center overflow-hidden"
                      style={{
                        flex: section.bars,
                        backgroundColor: track.sections[i] && !isHidden ? track.color : 'transparent',
                        opacity: track.sections[i] ? (isHidden ? 0.2 : 0.8) : 0.08,
                        borderColor: track.sections[i] ? track.color + '60' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {track.sections[i] === 1 && section.bars >= 8 && !isHidden && (
                        <span className="text-[9px] text-white/70 font-mono px-1 truncate">{track.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Bar counter */}
          <div className="flex border-t border-white/5 bg-black/20">
            <div className="w-44 shrink-0 border-r border-white/10 px-4 py-1.5 text-[10px] text-gray-700 uppercase tracking-wider">Bar</div>
            <div className="flex flex-1 py-1.5">
              {arrangement.sections.map((section, i) => {
                const barsBefore = arrangement.sections.slice(0, i).reduce((s, x) => s + x.bars, 0)
                return (
                  <div key={i} className="border-r border-white/5 px-2" style={{ flex: section.bars }}>
                    <span className="text-xs text-gray-600 font-mono">{barsBefore + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-white/5 flex gap-4 flex-wrap items-center">
        <span className="text-xs text-gray-600">Click a track name to mute/unmute it — the groove plays only the visible tracks</span>
        <button
          onClick={() => setHidden({})}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
        >
          Show all
        </button>
      </div>
    </div>
  )
}
