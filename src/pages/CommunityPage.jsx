import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import genres from '../data/genres.json'
import {
  listPublicArrangements, listMyArrangements, deleteArrangement,
  stageArrangementForLoad, toggleLike, getLikesForArrangements, getCommentCounts,
} from '../lib/arrangements'
import CommentsModal from '../components/CommentsModal'
import UploadMidiModal from '../components/UploadMidiModal'

const genreName = id => genres.find(g => g.id === id)?.name || 'Custom'

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function HeartIcon({ filled }) {
  return filled
    ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

function CommentIcon() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { user, displayName, configured, signOut } = useAuth()
  const [tab, setTab] = useState('community')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likes, setLikes] = useState({})        // arrangementId → { count, liked }
  const [commentCounts, setCommentCounts] = useState({})
  const [commentsFor, setCommentsFor] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = tab === 'mine' ? await listMyArrangements() : await listPublicArrangements()
      setItems(data)
      if (data.length) {
        const ids = data.map(r => r.id)
        const [lk, cc] = await Promise.all([getLikesForArrangements(ids), getCommentCounts(ids)])
        setLikes(lk)
        setCommentCounts(cc)
      }
    } catch (err) {
      setError(err.message || 'Could not load arrangements')
    } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { if (configured) load(); else setLoading(false) }, [load, configured])

  function open(rec) {
    const gid = rec.data?.genreId || rec.genre_id
    if (!gid) { setError('This arrangement has no genre attached.'); return }
    stageArrangementForLoad(rec)
    navigate(`/genre/${gid}`)
  }

  async function remove(rec) {
    if (!confirm(`Delete "${rec.title}"? This can't be undone.`)) return
    try { await deleteArrangement(rec.id); setItems(items.filter(i => i.id !== rec.id)) }
    catch (err) { setError(err.message) }
  }

  async function handleLike(id) {
    if (!user) { navigate('/login'); return }
    const prev = likes[id] || { count: 0, liked: false }
    // Optimistic update
    setLikes(l => ({ ...l, [id]: { count: prev.liked ? prev.count - 1 : prev.count + 1, liked: !prev.liked } }))
    try { await toggleLike(id) }
    catch { setLikes(l => ({ ...l, [id]: prev })) }
  }

  function handleUploaded(rec) {
    setShowUpload(false)
    if (tab === 'mine' || tab === 'community') load()
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Nav */}
        <nav className="flex items-center justify-between py-5 border-b border-white/[0.06]">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoopLab" width={28} height={28} className="h-7 w-7 rounded-md" />
            <span className="font-semibold text-white text-sm">LoopLab</span>
          </button>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-[13px] text-gray-400 hidden sm:inline">Hey, <span className="text-white">{displayName}</span></span>
                <button onClick={signOut} className="text-[12px] text-gray-500 hover:text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition">Sign out</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="text-[13px] text-white border border-white/[0.1] hover:border-white/25 rounded-lg px-3 py-1.5 transition">Sign in</button>
            )}
          </div>
        </nav>

        {/* Header */}
        <div className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Community Arrangements</h1>
            <p className="text-gray-500 text-sm max-w-lg">
              Browse arrangements and MIDI files shared by other producers. Like, comment, and open them in the builder.
            </p>
          </div>
          {user && configured && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 text-[13px] border border-[#7c5cfc]/50 bg-[#7c5cfc]/10 hover:bg-[#7c5cfc]/20 text-[#c4b5fd] rounded-lg px-4 py-2 transition flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload MIDI
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {['community', ...(user ? ['mine'] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[13px] px-4 py-1.5 rounded-lg border transition ${tab === t ? 'border-[#7c5cfc]/60 bg-[#7c5cfc]/15 text-white' : 'border-white/[0.08] text-gray-400 hover:text-white'}`}
            >{t === 'mine' ? 'My Arrangements' : 'Community'}</button>
          ))}
        </div>

        {!configured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
            The community backend isn't connected yet. Add your Supabase keys in <code>src/lib/supabaseConfig.js</code>.
          </div>
        )}

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300 mb-5">{error}</div>}

        {configured && tab === 'mine' && !user && (
          <div className="text-center py-16 text-gray-600">
            <button onClick={() => navigate('/login')} className="text-[#a78bfa] hover:text-[#c4b5fd]">Sign in</button> to see your saved arrangements.
          </div>
        )}

        {/* Grid */}
        {configured && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-600 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-sm">
                {tab === 'mine' ? "You haven't saved any arrangements yet." : 'No arrangements have been shared yet — be the first!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-16">
                {items.map(rec => {
                  const lk = likes[rec.id] || { count: 0, liked: false }
                  const cc = commentCounts[rec.id] || 0
                  const isMidi = rec.source_type === 'midi_upload'
                  return (
                    <div key={rec.id} className="bg-[#16161e] border border-white/[0.06] rounded-xl p-4 flex flex-col hover:border-white/[0.14] transition">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded text-[#a78bfa] bg-[#7c5cfc]/15">
                          {isMidi ? 'MIDI file' : genreName(rec.data?.genreId || rec.genre_id)}
                        </span>
                        {!rec.is_public && tab === 'mine' && (
                          <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">Private</span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-semibold text-white mb-1 leading-snug">{rec.title}</h3>
                      {rec.description && <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-2">{rec.description}</p>}

                      <div className="mt-auto">
                        <div className="flex items-center justify-between pt-2 mb-3">
                          <span className="text-[11px] text-gray-600">by {rec.author_name} · {timeAgo(rec.created_at)}</span>
                          {/* Like + comment counts */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(rec.id)}
                              className={`flex items-center gap-1 text-[12px] transition ${lk.liked ? 'text-rose-400' : 'text-gray-600 hover:text-rose-400'}`}
                              title={user ? (lk.liked ? 'Unlike' : 'Like') : 'Sign in to like'}
                            >
                              <HeartIcon filled={lk.liked} />
                              {lk.count > 0 && <span>{lk.count}</span>}
                            </button>
                            <button
                              onClick={() => setCommentsFor(rec)}
                              className="flex items-center gap-1 text-[12px] text-gray-600 hover:text-white transition"
                            >
                              <CommentIcon />
                              {cc > 0 && <span>{cc}</span>}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMidi ? (
                            <a
                              href={rec.midi_url}
                              download
                              className="flex-1 text-center text-[12px] bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white rounded-lg py-1.5 transition"
                            >Download MIDI</a>
                          ) : (
                            <button onClick={() => open(rec)} className="flex-1 text-[12px] bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white rounded-lg py-1.5 transition">Open in builder</button>
                          )}
                          {tab === 'mine' && (
                            <button onClick={() => remove(rec)} className="text-[12px] text-gray-500 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 rounded-lg px-3 py-1.5 transition">Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {commentsFor && (
        <CommentsModal
          arrangement={commentsFor}
          onClose={() => setCommentsFor(null)}
          onCountChange={n => setCommentCounts(c => ({ ...c, [commentsFor.id]: n }))}
        />
      )}
      {showUpload && <UploadMidiModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </div>
  )
}
