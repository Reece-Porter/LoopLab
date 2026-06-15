import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { saveArrangement } from '../lib/arrangements'

// Modal for publishing / saving the current Build-Your-Own arrangement.
// `getData()` returns the serialised arrangement object when called.
export default function PublishModal({ open, onClose, getData, genreId }) {
  const navigate = useNavigate()
  const { user, configured } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await saveArrangement({ title, description, genreId, isPublic, data: getData() })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#16161e] border border-white/[0.1] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{isPublic ? 'Publish arrangement' : 'Save arrangement'}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">×</button>
        </div>

        {!configured ? (
          <p className="text-[13px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            Saving isn't set up yet — the site owner needs to connect Supabase.
          </p>
        ) : !user ? (
          <div className="text-center py-4">
            <p className="text-[13px] text-gray-400 mb-4">Sign in to save your arrangement and come back to it later.</p>
            <button onClick={() => navigate('/login')} className="bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white text-sm font-medium rounded-lg px-5 py-2 transition">Sign in</button>
          </div>
        ) : done ? (
          <div className="text-center py-4">
            <p className="text-emerald-400 text-sm mb-4">✓ Saved!</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate('/community')} className="bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white text-[13px] rounded-lg px-4 py-2 transition">View in community</button>
              <button onClick={onClose} className="text-[13px] text-gray-400 border border-white/10 rounded-lg px-4 py-2 hover:text-white transition">Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-300">{error}</div>}
            <input
              type="text" required placeholder="Title (e.g. Dark UKG roller)" value={title} onChange={e => setTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 transition"
            />
            <textarea
              placeholder="Description (optional) — what's the vibe, what should people listen for?"
              value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={400}
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 transition resize-none"
            />
            <label className="flex items-center gap-2.5 text-[13px] text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-[#7c5cfc] w-4 h-4" />
              Share publicly in the community gallery
            </label>
            <button type="submit" disabled={busy} className="w-full bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white font-medium text-sm rounded-lg px-4 py-2.5 transition disabled:opacity-50">
              {busy ? 'Saving…' : isPublic ? 'Publish' : 'Save privately'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
