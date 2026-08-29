// Post-build pre-render for SEO.
// LoopLab is a client-rendered SPA, so crawlers see an empty #root. This script
// writes a static HTML file per STATIC route (home, tips, tools, and each genre
// breakdown) with the correct <title>/description/OG tags AND real content
// inside #root. The app uses createRoot().render(), which REPLACES #root on
// load — so users get the full SPA and crawlers/social scrapers get real
// content and metadata with no JavaScript. Also emits sitemap.xml + robots.txt.
//
// Dependency-free. Run after `vite build`.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const ORIGIN = 'https://looplab.uk'

const shell = readFileSync(join(DIST, 'index.html'), 'utf8')
const genres = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'genres.json'), 'utf8'))

// ── escaping ─────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = s => esc(s).replace(/"/g, '&quot;')

// Trim to ~len chars on a word boundary, no dangling connective words.
function clamp(s, len = 158) {
  s = String(s).trim()
  if (s.length <= len) return s
  let cut = s.slice(0, len)
  cut = cut.slice(0, cut.lastIndexOf(' '))
  return cut.replace(/[\s,.;:—-]*(?:and|the|a|in|of|with|for)?$/i, '').trim() + '…'
}

// ── inject per-route metadata + content into a copy of the built shell ───────
function render({ path, title, description, contentHtml, jsonLd }) {
  let html = shell
  const url = ORIGIN + path
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escAttr(description)}$2`)
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escAttr(title)}$2`)
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escAttr(description)}$2`)
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escAttr(url)}$2`)
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escAttr(title)}$2`)
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escAttr(description)}$2`)
  // canonical
  html = html.replace('</head>', `    <link rel="canonical" href="${escAttr(url)}" />\n  </head>`)
  // JSON-LD structured data
  if (jsonLd) {
    html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`)
  }
  // static content inside #root (replaced by the SPA on load). Dark inline
  // styles so there is no white flash before the app CSS applies.
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><div style="min-height:100vh;background:#0a0a0b;color:#ededed;font-family:Inter,system-ui,sans-serif;padding:48px 20px;max-width:900px;margin:0 auto">${contentHtml}</div></div>`,
  )
  return html
}

function write(path, html) {
  const dir = path === '/' ? DIST : join(DIST, path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

// ── content blocks ───────────────────────────────────────────────────────────
const footerNav = `<nav style="margin-top:40px;font-size:13px;color:#8a8a92"><a href="/" style="color:#c6f24e;text-decoration:none">LoopLab</a> · <a href="/tips" style="color:#8a8a92;text-decoration:none">Tips</a> · <a href="/tools" style="color:#8a8a92;text-decoration:none">Tools</a></nav>`

function genreContent(g) {
  const parts = (g.parts || []).map(p => `<li><strong>${esc(p.name)}</strong>${p.tips && p.tips[0] ? ' — ' + esc(p.tips[0]) : ''}</li>`).join('')
  return `
    <h1 style="font-family:Oswald,Inter,sans-serif;text-transform:uppercase;font-size:40px;letter-spacing:-0.01em;margin:0 0 12px">How to make ${esc(g.name)} in FL Studio</h1>
    <p style="font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:0.14em;color:#8a8a92;font-size:12px;margin:0 0 20px">${esc(g.bpm)} BPM · ${esc(g.key)}</p>
    <p style="color:#c9c9d0;line-height:1.6;max-width:640px">${esc(g.description)}</p>
    <h2 style="font-family:Oswald,Inter,sans-serif;text-transform:uppercase;font-size:20px;margin:32px 0 12px">Track elements</h2>
    <ul style="color:#a8a8b0;line-height:1.8;max-width:680px">${parts}</ul>
    ${footerNav}`
}

function homeContent() {
  const links = genres.map(g => `<li><a href="/genre/${esc(g.id)}" style="color:#ededed;text-decoration:none">${esc(g.name)}</a> <span style="color:#55555c;font-family:'Space Mono',monospace;font-size:12px">${esc(g.bpm)} BPM</span></li>`).join('')
  return `
    <h1 style="font-family:Oswald,Inter,sans-serif;text-transform:uppercase;font-size:56px;letter-spacing:-0.02em;margin:0 0 8px">Genre Library</h1>
    <p style="color:#8a8a92;font-size:16px;max-width:600px;margin:0 0 28px">FL Studio production reference — BPM, key, patterns and full arrangement guides for ${genres.length} electronic genres. Free, no account needed.</p>
    <ul style="list-style:none;padding:0;line-height:2;columns:2;max-width:640px">${links}</ul>
    ${footerNav}`
}

const staticContent = title => `
  <h1 style="font-family:Oswald,Inter,sans-serif;text-transform:uppercase;font-size:40px;margin:0 0 12px">${esc(title)}</h1>
  <p style="color:#8a8a92;max-width:600px">Loading LoopLab…</p>${footerNav}`

// ── routes ───────────────────────────────────────────────────────────────────
const urls = []

// Home
write('/', render({
  path: '/',
  title: 'LoopLab — FL Studio Production Reference',
  description: `Free FL Studio production reference for ${genres.length} electronic genres — BPM, key, drum patterns, basslines, arrangement templates and MIDI export. No signup.`,
  contentHtml: homeContent(),
  jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'LoopLab', url: ORIGIN, description: 'FL Studio production reference tool.' },
}))
urls.push({ loc: ORIGIN + '/', priority: '1.0' })

// Tips + Tools
write('/tips', render({ path: '/tips', title: 'FL Studio Tips & Shortcuts | LoopLab', description: 'Handy FL Studio keyboard shortcuts and workflow tips for faster electronic music production.', contentHtml: staticContent('FL Studio Tips & Shortcuts') }))
urls.push({ loc: ORIGIN + '/tips', priority: '0.6' })
write('/tools', render({ path: '/tools', title: 'Production Tools & Resources | LoopLab', description: 'A curated set of free tools and resources for electronic music producers.', contentHtml: staticContent('Production Tools') }))
urls.push({ loc: ORIGIN + '/tools', priority: '0.6' })
write('/isolator', render({ path: '/isolator', title: 'Vocal Isolator — LoopLab', description: 'Pull a rough vocal out of a track in your browser, chop it live and save or download the chunks. Free, no upload.', contentHtml: staticContent('Vocal Isolator') }))
urls.push({ loc: ORIGIN + '/isolator', priority: '0.6' })

// Genre pages
for (const g of genres) {
  const path = `/genre/${g.id}`
  const title = `${g.name} in FL Studio — ${g.bpm} BPM Breakdown | LoopLab`
  const description = clamp(`How to make ${g.name} in FL Studio — ${g.bpm} BPM, key ${g.key}. ${g.description}`)
  write(path, render({
    path, title, description,
    contentHtml: genreContent(g),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: `How to make ${g.name} in FL Studio`,
      description: g.description, about: g.name,
      publisher: { '@type': 'Organization', name: 'LoopLab', url: ORIGIN },
      mainEntityOfPage: ORIGIN + path,
    },
  }))
  urls.push({ loc: ORIGIN + path, priority: '0.8' })
}

// ── sitemap.xml + robots.txt ─────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`)

console.log(`[prerender] wrote ${urls.length} static pages + sitemap.xml + robots.txt`)
