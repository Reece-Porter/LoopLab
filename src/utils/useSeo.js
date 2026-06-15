import { useEffect } from 'react'

const DEFAULT_TITLE = 'LoopLab — FL Studio Production Reference'
const DEFAULT_DESC =
  'Free FL Studio reference tool — genre breakdowns, arrangement templates, MIDI export, vocal samples and a DJ deck. No signup.'

// Lightweight per-route SEO. Updates the document title + meta description so
// each page reads well in browser tabs, bookmarks and search results (Google
// renders client-side JS, so these dynamic values are picked up on crawl).
export function useSeo(title, description) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE
    const desc = description || DEFAULT_DESC
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', desc)
    return () => {
      document.title = DEFAULT_TITLE
      tag.setAttribute('content', DEFAULT_DESC)
    }
  }, [title, description])
}
