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
      <div className="w-full max-w-sm bg-surface border border-hairline p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold uppercase tracking-tight text-ink">{isPublic ? 'Publish arrangement' : 'Save arrangement'}</h3>
          <button onClick={onClose} className="text-faint hover:text-dim text-lg leading-none">×</button>
        </div>

        {!configured ? (
          <p className="text-[13px] text-dim bg-surface-2 border border-hairline p-3">
            Saving isn't set up yet — the site owner needs to connect Supabase.
          </p>
        ) : !user ? (
          <div className="text-center py-4">
            <p className="text-[13px] text-dim mb-4">Sign in to save your arrangement and come back to it later.</p>
            <button onClick={() => navigate('/login')} className="bg-acid hover:bg-acid-dim text-base font-display font-semibold uppercase tracking-wide text-sm px-5 py-2 transition-colors duration-150">Sign in</button>
          </div>
        ) : done ? (
          <div className="text-center py-4">
            <p className="text-acid text-sm mb-4">✓ Saved!</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate('/community')} className="bg-acid hover:bg-acid-dim text-base font-mono uppercase tracking-[0.1em] text-[12px] px-4 py-2 transition-colors duration-150">View in community</button>
              <button onClick={onClose} className="text-[13px] text-dim border border-hairline  px-4 py-2 hover:text-ink transition">Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="border border-red-500/40 bg-surface-2 p-2.5 text-[12px] text-red-300">{error}</div>}
            <input
              type="text" required placeholder="Title (e.g. Dark UKG roller)" value={title} onChange={e => setTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-surface-2 border border-hairline  px-3.5 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
            />
            <textarea
              placeholder="Description (optional) — what's the vibe, what should people listen for?"
              value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={400}
              className="w-full bg-surface-2 border border-hairline  px-3.5 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150-colors duration-150 resize-none"
            />
            <label className="flex items-center gap-2.5 text-[13px] text-dim cursor-pointer select-none">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-acid w-4 h-4" />
              Share publicly in the community gallery
            </label>
            <button type="submit" disabled={busy} className="w-full bg-acid hover:bg-acid-dim text-base font-display font-semibold uppercase tracking-wide text-sm px-4 py-3 transition-colors duration-150 disabled:opacity-50">
              {busy ? 'Saving…' : isPublic ? 'Publish' : 'Save privately'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
