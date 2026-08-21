export default function PartSection({ part, accentClass }) {
  return (
    <div className=" bg-surface border border-hairline p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{part.icon}</span>
        <h3 className="text-sm font-semibold text-white">{part.name}</h3>
      </div>
      <ul className="space-y-2">
        {part.tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-xs text-dim leading-relaxed">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${accentClass} shrink-0`} />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}
