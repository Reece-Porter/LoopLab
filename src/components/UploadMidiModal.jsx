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
      <div className="w-full max-w-md bg-surface border border-hairline overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h2 className="text-[15px] font-display font-bold uppercase tracking-tight text-ink">Upload MIDI</h2>
          <button onClick={onClose} className="text-dim hover:text-ink transition-colors duration-150 text-xl leading-none">✕</button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <div className="text-3xl mb-3">🎹</div>
            <p className="font-display font-bold uppercase tracking-tight text-ink mb-1">MIDI uploaded!</p>
            <p className="text-dim text-[13px] mb-5">Your file is now in the community.</p>
            <button onClick={onClose} className="text-[12px] font-mono uppercase tracking-[0.1em] bg-acid hover:bg-acid-dim text-base px-5 py-2 transition-colors duration-150">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-5 space-y-4">
            {/* File picker */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-hairline hover:border-acid p-6 text-center cursor-pointer transition"
            >
              <input ref={inputRef} type="file" accept=".mid,.midi" className="hidden" onChange={pickFile} />
              {file ? (
                <div>
                  <p className="text-ink text-[13px] font-semibold">{file.name}</p>
                  <p className="text-faint text-[11px] mt-0.5">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] text-dim mb-1">Click to select a MIDI file</p>
                  <p className="text-[11px] text-faint">.mid or .midi — max 5 MB</p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="font-mono text-[10px] text-dim uppercase tracking-[0.18em] block mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Name your MIDI file"
                className="w-full bg-surface-2 border border-hairline  px-3 py-2 text-[13px] text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-mono text-[10px] text-dim uppercase tracking-[0.18em] block mb-1">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={400}
                rows={2}
                placeholder="What genre, key, BPM? (optional)"
                className="w-full bg-surface-2 border border-hairline  px-3 py-2 text-[13px] text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150-colors duration-150 resize-none"
              />
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setIsPublic(p => !p)}
                className={`w-9 h-5 rounded-full transition-colors ${isPublic ? 'bg-acid' : 'bg-white/10'} relative`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-dim">{isPublic ? 'Public — visible in community' : 'Private — only you can see it'}</span>
            </label>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 text-[13px] text-dim hover:text-ink border border-hairline  py-2 transition">Cancel</button>
              <button type="submit" disabled={busy} className="flex-1 text-[12px] font-mono uppercase tracking-[0.1em] bg-acid hover:bg-acid-dim disabled:opacity-40 text-base py-2.5 transition-colors duration-150">
                {busy ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
