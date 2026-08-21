import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getComments, addComment, deleteComment } from '../lib/arrangements'

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function CommentsModal({ arrangement, onClose, onCountChange }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getComments(arrangement.id)
      .then(setComments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [arrangement.id])

  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setPosting(true); setError('')
    try {
      const c = await addComment(arrangement.id, body)
      const updated = [...comments, c]
      setComments(updated)
      onCountChange?.(updated.length)
      setBody('')
    } catch (err) { setError(err.message) }
    finally { setPosting(false) }
  }

  async function remove(id) {
    try {
      await deleteComment(id)
      const updated = comments.filter(c => c.id !== id)
      setComments(updated)
      onCountChange?.(updated.length)
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface border border-hairline overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mb-1">Comments on</p>
            <h2 className="text-[15px] font-display font-bold uppercase tracking-tight text-ink truncate">{arrangement.title}</h2>
          </div>
          <button onClick={onClose} className="text-dim hover:text-ink transition-colors duration-150 text-xl leading-none">✕</button>
        </div>

        {/* Comments list */}
        <div className="max-h-72 overflow-y-auto px-5 py-3 space-y-3">
          {loading && <p className="text-center text-faint text-sm py-6">Loading…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-center text-faint text-sm py-6">No comments yet — be the first!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 group">
              <div className="w-7 h-7 rounded-full bg-acid/15 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-acid">
                {c.author_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[12px] font-mono uppercase tracking-wide text-ink">{c.author_name}</span>
                  <span className="text-[11px] text-faint">{timeAgo(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button onClick={() => remove(c.id)} className="text-[11px] text-faint hover:text-red-400 transition ml-auto opacity-0 group-hover:opacity-100">Delete</button>
                  )}
                </div>
                <p className="text-[13px] text-dim leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div className="px-5 py-4 border-t border-hairline">
          {error && <p className="text-[12px] text-red-400 mb-2">{error}</p>}
          {user ? (
            <form onSubmit={submit} className="flex gap-2">
              <input
                type="text"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
                className="flex-1 bg-surface-2 border border-hairline px-3 py-2 text-[13px] text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
              />
              <button
                type="submit"
                disabled={posting || !body.trim()}
                className="text-[13px] bg-acid hover:bg-acid-dim disabled:opacity-40 text-base font-mono uppercase tracking-[0.1em] text-[12px] px-4 py-2 transition-colors duration-150"
              >{posting ? '…' : 'Post'}</button>
            </form>
          ) : (
            <p className="text-[13px] text-dim text-center">
              <button onClick={() => navigate('/login')} className="text-acid hover:text-acid">Sign in</button> to leave a comment.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
