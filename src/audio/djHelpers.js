// Helpers shared by the Player/Downloader and the dual DJ Deck.

// Build a filesystem-safe "Artist - Title" name from a backend /api/info result.
export function makeTrackName(info) {
  if (!info || !info.title) return 'track'
  const title = String(info.title).trim()
  const artist = (info.uploader || '').trim()
  const hasArtist = artist && !title.toLowerCase().includes(artist.toLowerCase())
  const base = hasArtist ? `${artist} - ${title}` : title
  return base.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'track'
}

export function getBackendUrl() {
  return (localStorage.getItem('looplab-backend') || '').replace(/\/$/, '')
}

export function isStreamingUrl(raw) {
  return /soundcloud\.com|snd\.sc|youtube\.com|youtu\.be/.test(raw)
}

export function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
