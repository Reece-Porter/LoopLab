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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="w-full max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-sm">← Back</button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-2xl">💡</span>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Suggestions
            </h1>
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Got an idea to make LoopLab better? A genre or song you'd like added, a feature request, or a bug report — send it over and we'll take a look.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Anonymous"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition"
            >
              <option value="" className="bg-gray-900">Select a category…</option>
              <option value="LoopLab Suggestion — New Genre" className="bg-gray-900">Add a new genre</option>
              <option value="LoopLab Suggestion — New Song" className="bg-gray-900">Add a reference song</option>
              <option value="LoopLab Suggestion — Song Accuracy" className="bg-gray-900">Song sounds wrong / accuracy fix</option>
              <option value="LoopLab Suggestion — New Feature" className="bg-gray-900">Feature request</option>
              <option value="LoopLab Suggestion — Bug Report" className="bg-gray-900">Bug report</option>
              <option value="LoopLab Suggestion — DJ Deck" className="bg-gray-900">DJ Deck / Player feedback</option>
              <option value="LoopLab Suggestion — Other" className="bg-gray-900">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Your suggestion</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Describe your idea or issue in as much detail as you like…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-sm text-white transition shadow-lg shadow-amber-900/20"
          >
            Send Suggestion →
          </button>

          <p className="text-center text-xs text-gray-600">
            Opens your email client with the message pre-filled and sends to{' '}
            <span className="text-gray-500">looplab.help@outlook.com</span>
          </p>
        </form>

      </div>
    </div>
  )
}
