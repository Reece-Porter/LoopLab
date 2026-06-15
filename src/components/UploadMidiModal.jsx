import { useState, useRef } from 'react'
import { uploadMidi } from '../lib/arrangements'

export default function UploadMidiModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef()

  function pickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.match(/\.(mid|midi)$/i)) { setError('Please select a .mid or .midi file'); return }
    setFile(f)
    setError('')
    if (!title) setTitle(f.name.replace(/\.(mid|midi)$/i, ''))
  }

  async function submit(e) {
    e.preventDefault()
    if (!file) { setError('Select a MIDI file first'); return }
    if (!title.trim()) { setError('Title is required'); return }
    setBusy(true); setError('')
    try {
      const rec = await uploadMidi({ file, title, description: desc, isPublic })
      setDone(true)
      onUploaded?.(rec)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="w-full max-w-md bg-[#16161e] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-white">Upload MIDI</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <div className="text-3xl mb-3">🎹</div>
            <p className="text-white font-semibold mb-1">MIDI uploaded!</p>
            <p className="text-gray-500 text-[13px] mb-5">Your file is now in the community.</p>
            <button onClick={onClose} className="text-[13px] bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white rounded-lg px-5 py-2 transition">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-5 space-y-4">
            {/* File picker */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/[0.1] hover:border-[#7c5cfc]/50 rounded-xl p-6 text-center cursor-pointer transition"
            >
              <input ref={inputRef} type="file" accept=".mid,.midi" className="hidden" onChange={pickFile} />
              {file ? (
                <div>
                  <p className="text-white text-[13px] font-semibold">{file.name}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] text-gray-400 mb-1">Click to select a MIDI file</p>
                  <p className="text-[11px] text-gray-600">.mid or .midi — max 5 MB</p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wide block mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Name your MIDI file"
                className="w-full bg-[#0f0f13] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/50 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wide block mb-1">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={400}
                rows={2}
                placeholder="What genre, key, BPM? (optional)"
                className="w-full bg-[#0f0f13] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/50 transition resize-none"
              />
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setIsPublic(p => !p)}
                className={`w-9 h-5 rounded-full transition-colors ${isPublic ? 'bg-[#7c5cfc]' : 'bg-white/10'} relative`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-gray-300">{isPublic ? 'Public — visible in community' : 'Private — only you can see it'}</span>
            </label>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 text-[13px] text-gray-400 hover:text-white border border-white/[0.08] rounded-lg py-2 transition">Cancel</button>
              <button type="submit" disabled={busy} className="flex-1 text-[13px] bg-[#7c5cfc] hover:bg-[#6d4ef0] disabled:opacity-40 text-white rounded-lg py-2 transition">
                {busy ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
