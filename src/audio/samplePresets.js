// Hardcoded vocal/acapella presets. Add matching audio files to public/samples/.
// Files are served at /LoopLab/samples/<filename> on GitHub Pages.
//
// File naming is intentional — drop any of these into public/samples/ and the
// matching preset will become available in the arrangement builder automatically.
// Supported formats: .mp3, .wav, .ogg
//
// Suggested sources (CC0 / royalty-free):
//   freesound.org  — filter by CC0, search "vocal chop", "house vocals", etc.
//   looperman.com  — free acapellas (check individual licence per clip)
//   Your own FL Studio exports — bounce a vocal loop to audio and drop it here

const BASE = import.meta.env.BASE_URL

export const SAMPLE_PRESETS = [
  // ── House / Deep House ─────────────────────────────────────────────────────
  { id: 'preset_house_ah',      name: 'House "Ah"',      src: `${BASE}samples/house-ah.mp3`,      genre: 'house' },
  { id: 'preset_house_ooh',     name: 'House "Ooh"',     src: `${BASE}samples/house-ooh.mp3`,     genre: 'house' },
  { id: 'preset_deep_vox',      name: 'Deep House Vox',  src: `${BASE}samples/deep-house-vox.mp3`, genre: 'deep-house' },
  { id: 'preset_piano_house_v', name: 'Piano House Vox', src: `${BASE}samples/piano-house-vox.mp3`, genre: 'house' },
  // ── Tech House / Techno ────────────────────────────────────────────────────
  { id: 'preset_tech_chop',     name: 'Tech Chop',       src: `${BASE}samples/tech-house-chop.mp3`, genre: 'tech-house' },
  { id: 'preset_techno_vox',    name: 'Techno Vox',      src: `${BASE}samples/techno-vox.mp3`,    genre: 'techno' },
  { id: 'preset_rave_vocal',    name: 'Rave Vocal',      src: `${BASE}samples/rave-vocal.mp3`,    genre: 'hard-techno' },
  // ── Hard House / Hard Bounce ───────────────────────────────────────────────
  { id: 'preset_hard_house_v',  name: 'Hard House Vox',  src: `${BASE}samples/hard-house-vox.mp3`, genre: 'hard-house' },
  { id: 'preset_bounce_vox',    name: 'Bounce Vox',      src: `${BASE}samples/bounce-vox.mp3`,   genre: 'bouncy-techno' },
  // ── Drum & Bass / Jungle ───────────────────────────────────────────────────
  { id: 'preset_dnb_vocal',     name: 'DnB Vocal',       src: `${BASE}samples/dnb-vocal.mp3`,    genre: 'dnb' },
  { id: 'preset_jungle_chant',  name: 'Jungle Chant',    src: `${BASE}samples/jungle-chant.mp3`, genre: 'dnb' },
  // ── Trap / Lo-Fi ───────────────────────────────────────────────────────────
  { id: 'preset_trap_hook',     name: 'Trap Hook',       src: `${BASE}samples/trap-hook.mp3`,    genre: 'trap' },
  { id: 'preset_lofi_vocal',    name: 'Lo-Fi Vocal',     src: `${BASE}samples/lofi-vocal.mp3`,   genre: 'lo-fi' },
  // ── Speed Garage ───────────────────────────────────────────────────────────
  { id: 'preset_garage_riff',   name: 'Garage Riff',     src: `${BASE}samples/speed-garage-vox.mp3`, genre: 'speed-garage' },
]
