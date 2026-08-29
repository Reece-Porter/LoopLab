// Long sung-vocal phrases (Cymatics "Euphoria" pack) that play over the DROP and
// BREAKDOWN sections of a genre's arrangement instead of the per-note vocal — a
// real sung hook rather than single notes.
//
// KEY-LOCKED, not tempo-locked: each phrase is pitched (by `semitones`) so it
// lands in the genre's own key — a minor genre uses either a matching minor
// phrase or its RELATIVE major (same notes), so it always sits in key. The
// player pitches it (rate = 2^(semitones/12)) and re-triggers it to fill the
// section, re-syncing to the bar grid each time. Shifts are tiny (0–1 semitone)
// so the voice stays natural. Lo-fi has no drop-type section to carry a hook and
// keeps the per-note vocal.

const BASE = import.meta.env.BASE_URL

// genreId → { file, semitones } (pitch shift to reach the genre's key)
export const VOCAL_PHRASES = {
  eurodance:       { file: 'let-me-love',     semitones: 0 },  // Gm ← Gm
  'speed-garage':  { file: 'let-me-love',     semitones: 0 },  // Gm ← Gm
  'deep-house':    { file: 'like-that',       semitones: -1 }, // Fm ← F#m −1
  house:           { file: 'like-that',       semitones: -1 }, // Fm ← F#m −1
  'hard-groove':   { file: 'baby-all-i-want', semitones: 0 },  // Dm ← F maj (rel.)
  'drum-and-bass': { file: 'baby-all-i-want', semitones: 0 },  // Dm ← F maj (rel.)
  'hard-house':    { file: 'stuck',           semitones: 1 },  // Cm ← Eb maj (rel.)
  'tech-house':    { file: 'stuck',           semitones: 1 },  // Cm ← Eb maj (rel.)
  schranz:         { file: 'stuck',           semitones: 1 },  // Cm ← Eb maj (rel.)
  trap:            { file: 'stuck',           semitones: 1 },  // Cm ← Eb maj (rel.)
  'bouncy-techno': { file: 'i-dont-know',     semitones: 0 },  // Am ← Am
  techno:          { file: 'i-dont-know',     semitones: 0 },  // Am ← Am
  'hard-techno':   { file: 'turn-up',         semitones: 1 },  // Em ← D#m +1
}

export function vocalPhraseFor(genreId) {
  const p = VOCAL_PHRASES[genreId]
  return p ? { ...p, src: `${BASE}samples/vocalphrases/${p.file}.wav` } : null
}
