export default function PlayButton({ playing, onClick, label = 'Play', accentClass }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors duration-150 ${
        playing
          ? 'bg-surface-2 text-ink border border-hairline'
          : 'bg-acid text-base hover:bg-acid-dim'
      }`}
    >
      {playing ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          Stop
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
