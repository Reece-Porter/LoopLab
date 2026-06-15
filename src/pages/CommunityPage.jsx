import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import genres from '../data/genres.json'
import {
  listPublicArrangements, listMyArrangements, deleteArrangement, stageArrangementForLoad,
} from '../lib/arrangements'

const genreName = id => genres.find(g => g.id === id)?.name || 'Custom'

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { user, displayName, configured, signOut } = useAuth()
  const [tab, setTab] = useState('community') // community | mine
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = tab === 'mine' ? await listMyArrangements() : await listPublicArrangements()
      setItems(data)
    } catch (err) {
      setError(err.message || 'Could not load arrangements')
    } finally {
      setLoading(false)
    }
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
        <div className="py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Community Arrangements</h1>
          <p className="text-gray-500 text-sm max-w-lg">
            Browse arrangements built and shared by other producers. Open one in the builder to play it, tweak it, or export it as MIDI.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setTab('community')}
            className={`text-[13px] px-4 py-1.5 rounded-lg border transition ${tab === 'community' ? 'border-[#7c5cfc]/60 bg-[#7c5cfc]/15 text-white' : 'border-white/[0.08] text-gray-400 hover:text-white'}`}
          >Community</button>
          {user && (
            <button
              onClick={() => setTab('mine')}
              className={`text-[13px] px-4 py-1.5 rounded-lg border transition ${tab === 'mine' ? 'border-[#7c5cfc]/60 bg-[#7c5cfc]/15 text-white' : 'border-white/[0.08] text-gray-400 hover:text-white'}`}
            >My Arrangements</button>
          )}
        </div>

        {/* Not configured */}
        {!configured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
            The community backend isn't connected yet. Add your Supabase keys in <code>src/lib/supabaseConfig.js</code> to enable uploads, accounts and the gallery.
          </div>
        )}

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300 mb-5">{error}</div>}

        {/* Sign-in prompt for "mine" */}
        {configured && tab === 'mine' && !user && (
          <div className="text-center py-16 text-gray-600">
            <button onClick={() => navigate('/login')} className="text-[#a78bfa] hover:text-[#c4b5fd]">Sign in</button> to see your saved arrangements.
          </div>
        )}

        {/* List */}
        {configured && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-600 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-sm">
                {tab === 'mine'
                  ? "You haven't saved any arrangements yet. Build one and hit Publish."
                  : 'No arrangements have been shared yet — be the first!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-16">
                {items.map(rec => (
                  <div key={rec.id} className="bg-[#16161e] border border-white/[0.06] rounded-xl p-4 flex flex-col hover:border-white/[0.14] transition">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded text-[#a78bfa] bg-[#7c5cfc]/15">
                        {genreName(rec.data?.genreId || rec.genre_id)}
                      </span>
                      {!rec.is_public && tab === 'mine' && (
                        <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">Private</span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-1 leading-snug">{rec.title}</h3>
                    {rec.description && <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3 mb-3">{rec.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[11px] text-gray-600">by {rec.author_name} · {timeAgo(rec.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => open(rec)} className="flex-1 text-[12px] bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white rounded-lg py-1.5 transition">Open in builder</button>
                      {tab === 'mine' && (
                        <button onClick={() => remove(rec)} className="text-[12px] text-gray-500 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 rounded-lg px-3 py-1.5 transition">Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
