// Hardcoded vocal sample presets, served same-origin from public/samples/.
// On GitHub Pages these resolve to /LoopLab/samples/<file>, so there is no
// CORS dependency and nothing to fetch from a third party at runtime.
//
// Source: Berklee College of Music vocal one-shots distributed with the
// MIT-licensed Tone.js project (github.com/Tonejs/audio). Sustained "aah"/"ooh"
// vowels — versatile vocal hits that suit house/techno/garage etc.
//
// To add your own: drop an .mp3/.wav into public/samples/ and add an entry here.

const BASE = import.meta.env.BASE_URL

// baseFreq = the sample's natural pitch, so the engine can pitch-shift it to
// follow a written hook melody (rate = noteFreq / baseFreq).
export const SAMPLE_PRESETS = [
  { id: 'preset_aah_f_hi',  name: 'Aah ♀ Hi',   src: `${BASE}samples/vocal-aah-female-hi.mp3`,  baseFreq: 440.00 }, // A4
  { id: 'preset_aah_f_mid', name: 'Aah ♀ Mid',  src: `${BASE}samples/vocal-aah-female-mid.mp3`, baseFreq: 220.00 }, // A3
  { id: 'preset_ooh_f',     name: 'Ooh ♀',      src: `${BASE}samples/vocal-ooh-female.mp3`,     baseFreq: 440.00 }, // A4
  { id: 'preset_aah_m_mid', name: 'Aah ♂ Mid',  src: `${BASE}samples/vocal-aah-male-mid.mp3`,   baseFreq: 220.00 }, // A3
  { id: 'preset_aah_m_low', name: 'Aah ♂ Low',  src: `${BASE}samples/vocal-aah-male-low.mp3`,   baseFreq: 110.00 }, // A2
  { id: 'preset_ooh_m_hi',  name: 'Ooh ♂ Hi',   src: `${BASE}samples/vocal-ooh-male-hi.mp3`,    baseFreq: 349.23 }, // F4
  { id: 'preset_ooh_m_mid', name: 'Ooh ♂ Mid',  src: `${BASE}samples/vocal-ooh-male-mid.mp3`,   baseFreq: 220.00 }, // A3
  { id: 'preset_ooh_m_low', name: 'Ooh ♂ Low',  src: `${BASE}samples/vocal-ooh-male-low.mp3`,   baseFreq: 110.00 }, // A2
  { id: 'preset_aah_m_c',   name: 'Aah ♂ C',    src: `${BASE}samples/vocal-aah-male-c.mp3`,     baseFreq: 130.81 }, // C3
  { id: 'preset_ooh_m_c',   name: 'Ooh ♂ C',    src: `${BASE}samples/vocal-ooh-male-c.mp3`,     baseFreq: 130.81 }, // C3
]

// Default vocal sample to drop onto a genre's reference arrangement, so the
// "Full Arrangement" player at the top has a real vocal on its Vocals track.
// Chosen to sit musically with each genre; falls back to a female "ooh".
export const GENRE_VOCAL_PRESET = {
  'eurodance':      'preset_aah_f_hi',  // euphoric female
  'house':          'preset_ooh_f',     // smooth female ooh
  'deep-house':     'preset_ooh_f',
  'tech-house':     'preset_aah_f_hi',  // bright female chop
  'techno':         'preset_ooh_f',     // darker ooh, A4 centre
  'hard-groove':    'preset_ooh_f',
  'hard-techno':    'preset_aah_f_hi',
  'schranz':        'preset_aah_m_mid', // (schranz has no vocal hook — harmless)
  'hard-house':     'preset_aah_f_hi',  // euphoric female
  'bouncy-techno':  'preset_aah_f_hi',
  'speed-garage':   'preset_ooh_f',
  'drum-and-bass':  'preset_aah_f_hi',
  'trap':           'preset_ooh_m_hi',  // male F4
  'lo-fi-hip-hop':  'preset_ooh_m_mid', // warm male A3
}

export function vocalPresetFor(genreId) {
  const id = GENRE_VOCAL_PRESET[genreId] || 'preset_ooh_f'
  return SAMPLE_PRESETS.find(p => p.id === id) || SAMPLE_PRESETS[0]
}
