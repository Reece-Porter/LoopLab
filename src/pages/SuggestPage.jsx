import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SuggestPage() {
  const navigate = useNavigate()
  const [name, setName]       = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    const body = encodeURIComponent(
      `Name: ${name || 'Anonymous'}\n\n${message}`
    )
    const sub  = encodeURIComponent(subject || 'LoopLab Suggestion')
    window.location.href = `mailto:looplab.help@outlook.com?subject=${sub}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="w-full max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate('/')} className="font-mono text-xs uppercase tracking-[0.16em] text-dim hover:text-acid transition-colors duration-150">← Back</button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-2xl">💡</span>
            <h1 className="font-display uppercase tracking-[0.02em] text-2xl font-bold text-ink">
              Suggestions
            </h1>
          </div>
        </div>

        <p className="text-dim text-sm leading-relaxed mb-8">
          Got an idea to make LoopLab better? A genre or song you'd like added, a feature request, or a bug report — send it over and we'll take a look.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-dim uppercase tracking-[0.16em] mb-1.5">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Anonymous"
              className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink placeholder-faint focus:border-acid transition-colors duration-150"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-dim uppercase tracking-[0.16em] mb-1.5">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink focus:border-acid transition-colors duration-150"
            >
              <option value="" className="bg-surface">Select a category…</option>
              <option value="LoopLab Suggestion — New Genre" className="bg-surface">Add a new genre</option>
              <option value="LoopLab Suggestion — New Song" className="bg-surface">Add a reference song</option>
              <option value="LoopLab Suggestion — Song Accuracy" className="bg-surface">Song sounds wrong / accuracy fix</option>
              <option value="LoopLab Suggestion — New Feature" className="bg-surface">Feature request</option>
              <option value="LoopLab Suggestion — Bug Report" className="bg-surface">Bug report</option>
              <option value="LoopLab Suggestion — DJ Deck" className="bg-surface">DJ Deck / Player feedback</option>
              <option value="LoopLab Suggestion — Other" className="bg-surface">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-dim uppercase tracking-[0.16em] mb-1.5">Your suggestion</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Describe your idea or issue in as much detail as you like…"
              className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink placeholder-faint focus:border-acid transition-colors duration-150 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-acid hover:bg-acid-dim font-display uppercase tracking-[0.08em] font-bold text-sm text-base transition-colors duration-150"
          >
            Send Suggestion →
          </button>

          <p className="text-center text-xs text-faint">
            Opens your email client with the message pre-filled and sends to{' '}
            <span className="text-dim">looplab.help@outlook.com</span>
          </p>
        </form>

      </div>
    </div>
  )
}
