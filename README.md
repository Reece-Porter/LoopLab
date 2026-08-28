# LoopLab

A free, no-signup **FL Studio production reference** for electronic producers,
live at **[looplab.uk](https://looplab.uk)**. Break any genre down by BPM, key,
drum patterns, bassline and arrangement; generate a track-starter progression;
audition everything in the browser with a hand-written Web Audio synth; and
export as MIDI.

## Features

- **Genre library** — 14 electronic genres, each with BPM/key, per-part tips and
  playable example patterns.
- **Arrangement view** — section-by-track breakdown with a live playhead, per-track
  mute/level, and MIDI export.
- **Build-your-own arrangement** — paint patterns into bars, then export or publish.
- **Track-starter generator** (`/generate`) — pick a genre, key and mood; get a
  genre-accurate chord progression + bassline + drum pattern; audition and export MIDI.
- **Vocal recorder** — record from the mic, trim, and drop clips into an arrangement.
- **DJ deck & player** — single-deck player with 3-band EQ + WAV export, and a dual
  deck with beat-matching. SoundCloud/YouTube loading and the downloader are
  invite-only (Supabase-gated).
- **Community gallery** — publish arrangements, like, comment, upload MIDI (Supabase).

Everything audio — the synth, sequencer, MIDI writer, BPM detection — is hand-written
with the Web Audio API. No audio libraries.

## Stack

- **React 19 + Vite + Tailwind CSS v4** (plain JavaScript, ESM), single-page app.
- **Supabase** — auth, community gallery, and per-user feature flags (RLS-enforced).
- **Hosting** — GitHub Pages (custom domain via `public/CNAME`). Static routes are
  pre-rendered at build time for SEO (`scripts/prerender.mjs` → per-route metadata +
  `sitemap.xml`/`robots.txt`).
- **Audio backend** — a small Express + `yt-dlp` service in `server/` (deployed on
  Render) fetches SoundCloud/YouTube audio for the deck and playlist downloader. It is
  gated by Supabase JWT + a `can_download` flag, verified server-side.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/ (also runs the pre-render step)
npm run preview    # serve the production build
npm run lint
```

Supabase keys live in `src/lib/supabaseConfig.js` (the anon key is public and
RLS-guarded). The database schema and row-level-security policies are in
`supabase-schema.sql` — paste it into the Supabase SQL editor to set up or update.

## Structure

- `src/pages/` — one component per route (home, genre, tips, tools, player, dj,
  community, auth, admin, generate).
- `src/components/` — arrangement view, custom builder, vocal recorder, playlist
  downloader, modals.
- `src/audio/` — synth, sequencer/schedulers, grooves, music theory, MIDI export,
  BPM detection, the starter generator.
- `src/data/` — genre definitions, reference songs, generator templates.
- `src/lib/` — Supabase client and data access.
- `server/` — the Render audio service.

## Deployment

Pushing to the deploy branch triggers the GitHub Pages workflow
(`.github/workflows/deploy.yml`): `npm ci && npm run build`, then publish `dist/`.
The audio backend deploys separately on Render from `server/` (see
`server/README.md`); it needs `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` set in its environment.

## Credits

Vocal one-shots in `public/samples/` are Berklee College of Music samples distributed
with the MIT-licensed [Tone.js](https://github.com/Tonejs/audio) project.
