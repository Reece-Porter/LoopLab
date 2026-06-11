// Music theory helpers — turn note names and chord symbols into frequencies.

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// Parse a note name like "A4", "C#5", "Eb3" into a MIDI number.
export function noteToMidi(name) {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name.trim())
  if (!m) return null
  const letter = m[1].toUpperCase()
  const accidental = m[2]
  const octave = parseInt(m[3], 10)
  let semitone = NOTE_INDEX[letter]
  if (accidental === '#') semitone += 1
  if (accidental === 'b') semitone -= 1
  return semitone + (octave + 1) * 12
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function noteToFreq(name) {
  const midi = noteToMidi(name)
  return midi == null ? null : midiToFreq(midi)
}

// Chord quality → semitone intervals from the root.
const QUALITIES = [
  ['maj9', [0, 4, 7, 11, 14]],
  ['maj7', [0, 4, 7, 11]],
  ['m7b5', [0, 3, 6, 10]],
  ['dim', [0, 3, 6]],
  ['m9', [0, 3, 7, 10, 14]],
  ['m7', [0, 3, 7, 10]],
  ['m', [0, 3, 7]],
  ['9', [0, 4, 7, 10, 14]],
  ['7', [0, 4, 7, 10]],
  ['', [0, 4, 7]],
]

// Parse a chord symbol like "Am9", "Fmaj7", "G7", "Bdim" into MIDI notes.
export function chordToMidi(symbol, baseOctave = 3) {
  const m = /^([A-Ga-g][#b]?)(.*)$/.exec(symbol.trim())
  if (!m) return []
  const rootName = m[1].toUpperCase()
  const rest = m[2]
  const rootMidi = noteToMidi(rootName + baseOctave)
  if (rootMidi == null) return []
  const quality = QUALITIES.find(([q]) => q === rest)
  const intervals = quality ? quality[1] : [0, 4, 7]
  return intervals.map(i => rootMidi + i)
}

export function chordToFreqs(symbol, baseOctave = 3) {
  return chordToMidi(symbol, baseOctave).map(midiToFreq)
}

// Parse the first BPM number out of a string like "128–145".
export function parseBpm(bpmString) {
  const m = /\d+/.exec(bpmString)
  return m ? parseInt(m[0], 10) : 120
}
