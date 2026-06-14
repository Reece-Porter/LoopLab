// Map a Tailwind gradient class ("from-purple-600 to-pink-500") to a CSS hex
// color, used for per-genre accent borders and glows across the UI.
const PALETTE = {
  purple:  { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
  pink:    { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
  red:     { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
  orange:  { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
  amber:   { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  yellow:  { 400: '#facc15', 500: '#eab308', 600: '#ca8a04' },
  green:   { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
  emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
  teal:    { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
  cyan:    { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
  blue:    { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
  indigo:  { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
  violet:  { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
  rose:    { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' },
  fuchsia: { 400: '#e879f9', 500: '#d946ef', 600: '#c026d3' },
  zinc:    { 700: '#3f3f46', 800: '#27272a', 900: '#18181b' },
}

export function accentFromColor(colorClass) {
  if (!colorClass) return '#a855f7'
  const m = colorClass.match(/from-(\w+)-(\d+)/)
  if (!m) return '#a855f7'
  const shade = PALETTE[m[1]]
  return (shade && shade[parseInt(m[2], 10)]) || '#a855f7'
}
