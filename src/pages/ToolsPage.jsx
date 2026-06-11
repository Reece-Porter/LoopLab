import { useNavigate } from 'react-router-dom'

// Curated, free (or freemium) production resources. External links open in a
// new tab. Grouped by what you're trying to find.
const CATEGORIES = [
  {
    title: 'Free Samples, Loops & Drums',
    icon: '🥁',
    blurb: 'One-shots, loops and full sample packs to drop straight into the Channel Rack.',
    links: [
      ['Splice (free packs)', 'https://splice.com/sounds/free', 'Huge sample library — free packs plus a pay-as-you-go subscription.'],
      ['Cymatics free packs', 'https://cymatics.fm/pages/free-download-vault', 'Quality genre-focused drum and melody packs, totally free.'],
      ['MusicRadar SampleRadar', 'https://www.musicradar.com/news/sampleradar', 'Thousands of free, royalty-free samples organised by theme.'],
      ['Looperman', 'https://www.looperman.com', 'Community loops, one-shots and a cappellas, free to use.'],
      ['99Sounds', 'https://99sounds.org', 'Free, high-quality sample libraries and sound effects.'],
    ],
  },
  {
    title: 'Vocals & Acapellas',
    icon: '🎤',
    blurb: 'Find a cappellas and vocal stems to sample, chop or remix.',
    links: [
      ['Acapellas4U', 'https://www.acapellas4u.co.uk', 'The classic community archive of a cappellas across every genre.'],
      ['Splice Vocals', 'https://splice.com/sounds/vocals', 'Royalty-free vocal loops, phrases and one-shots.'],
      ['Vocalound / Voloco', 'https://www.voloco.co', 'Free vocal samples and an auto-tune app for recording your own.'],
      ['ccMixter', 'http://ccmixter.org', 'Creative-Commons a cappellas and stems cleared for remixing.'],
      ['Bandlab (free a cappellas)', 'https://www.bandlab.com', 'Community stems and a free DAW for capturing vocals.'],
    ],
  },
  {
    title: 'Finding Tracks & References',
    icon: '🔎',
    blurb: 'Dig for reference tracks, identify songs and discover new music to learn from.',
    links: [
      ['Beatport', 'https://www.beatport.com', 'The go-to store for dance music — great for genre charts and references.'],
      ['SoundCloud', 'https://soundcloud.com', 'Underground tracks, DJ sets and unreleased edits across every scene.'],
      ['Shazam', 'https://www.shazam.com', 'Identify any track you hear out or in a mix.'],
      ['1001Tracklists', 'https://www.1001tracklists.com', 'Find the IDs played in DJ sets and festival recordings.'],
      ['YouTube DJ sets', 'https://www.youtube.com', 'Boiler Room, HÖR and festival sets — endless genre references.'],
    ],
  },
  {
    title: 'Free Plugins & Instruments',
    icon: '🎛️',
    blurb: 'VST/AU effects and synths that cost nothing and punch above their weight.',
    links: [
      ['Vital (synth)', 'https://vital.audio', 'A free, modern wavetable synth — rivals Serum for leads and basses.'],
      ['Surge XT', 'https://surge-synthesizer.github.io', 'Powerful open-source synth, free forever.'],
      ['Valhalla Supermassive', 'https://valhalladsp.com/shop/reverb/valhalla-supermassive', 'Gorgeous free reverb & delay for huge spaces.'],
      ['TDR Nova / Kotelnikov', 'https://www.tokyodawn.net/tokyo-dawn-labs', 'Pro-grade free EQ and mastering compressor.'],
      ['Spitfire LABS', 'https://labs.spitfireaudio.com', 'Beautiful free sampled instruments (pianos, strings, textures).'],
      ['OTT (Xfer)', 'https://xferrecords.com/freeware', 'The free multiband compressor on basically every EDM track.'],
    ],
  },
  {
    title: 'Learning & Mastering',
    icon: '🎓',
    blurb: 'Free tools to finish, master and level-check your tracks.',
    links: [
      ['LANDR / BandLab mastering', 'https://www.bandlab.com/mastering', 'Free AI mastering to get a quick loud, balanced bounce.'],
      ['Loudness Penalty', 'https://www.loudnesspenalty.com', 'Check how streaming platforms will turn your master down.'],
      ['You Suck at Producing (YouTube)', 'https://www.youtube.com/@adamneely', 'Theory & production channels worth following.'],
      ['r/FL_Studio', 'https://www.reddit.com/r/FL_Studio', 'Community help, project feedback and shortcut tips.'],
      ['Image-Line manual', 'https://www.image-line.com/fl-studio-learning/fl-studio-online-manual', 'The official FL Studio reference — searchable and free.'],
    ],
  },
]

export default function ToolsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-gray-950/80 border-b border-white/10">
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Home
          </button>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg">🧰</div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Production Tools & Resources</h1>
            <p className="text-xs text-gray-400">Free tools for finding tracks, samples, vocals and plugins</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-8">
        <p className="text-gray-400 mb-8 max-w-3xl">
          A hand-picked starter kit of free and freemium resources. Always check each site&rsquo;s licence before
          releasing — &ldquo;royalty-free&rdquo; and &ldquo;Creative Commons&rdquo; have different rules.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {CATEGORIES.map(cat => (
            <div key={cat.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span> {cat.title}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{cat.blurb}</p>
              <ul className="space-y-3">
                {cat.links.map(([name, url, desc]) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/15 transition p-3"
                    >
                      <span className="mt-0.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">↗</span>
                      <span>
                        <span className="text-sm font-semibold text-gray-100 group-hover:text-emerald-300 transition-colors">{name}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="text-center mt-16 text-xs text-gray-700">
          Links open in a new tab · always verify licensing before commercial release
        </footer>
      </div>
    </div>
  )
}
