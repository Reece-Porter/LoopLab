import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { backendFetch } from '../lib/backend'
import { getBackendUrl } from '../audio/djHelpers'
import { useSeo } from '../utils/useSeo'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isAdmin, displayName, signOut, configured } = useAuth()
  useSeo('Admin — LoopLab', 'LoopLab admin.')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadsEnabled, setDownloadsEnabled] = useState(true)
  const [savingSwitch, setSavingSwitch] = useState(false)
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      // Global kill switch (readable by anyone via RLS).
      const { data: s } = await supabase.from('app_settings').select('downloads_enabled').eq('id', 1).maybeSingle()
      if (s) setDownloadsEnabled(s.downloads_enabled !== false)

      // User list from the admin-only Render endpoint (needs the backend URL).
      const base = getBackendUrl()
      if (!base) {
        setError('Set your backend URL on the Player & Downloader page first — the user list is served by that service.')
        setUsers([])
        return
      }
      const res = await backendFetch(`${base}/api/admin/users`)
      if (!res.ok) {
        setError(res.status === 403 ? 'Your account is not an admin.' : `Could not load users (HTTP ${res.status}).`)
        setUsers([])
        return
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      setError(e.message || 'Could not load the admin data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  async function toggleDownload(u) {
    setSavingId(u.id)
    const next = !u.can_download
    setUsers(list => list.map(x => x.id === u.id ? { ...x, can_download: next } : x))
    const { error: e } = await supabase.from('profiles').update({ can_download: next }).eq('id', u.id)
    if (e) {
      setUsers(list => list.map(x => x.id === u.id ? { ...x, can_download: !next } : x))
      setError(e.message)
    }
    setSavingId(null)
  }

  async function toggleGlobal() {
    setSavingSwitch(true)
    const next = !downloadsEnabled
    setDownloadsEnabled(next)
    const { error: e } = await supabase.from('app_settings').update({ downloads_enabled: next }).eq('id', 1)
    if (e) { setDownloadsEnabled(!next); setError(e.message) }
    setSavingSwitch(false)
  }

  // ── Guards (cosmetic — real enforcement is RLS + the server checks) ──────────
  if (!configured) {
    return <Shell><p className="text-dim text-sm">Supabase isn't configured.</p></Shell>
  }
  if (!user) {
    return (
      <Shell>
        <p className="text-dim text-sm mb-4">Sign in to continue.</p>
        <button onClick={() => navigate('/login')} className="font-mono text-[11px] uppercase tracking-[0.16em] text-acid border border-acid/40 hover:bg-acid hover:text-base px-4 py-2 transition-colors duration-150">Sign in</button>
      </Shell>
    )
  }
  if (!isAdmin) {
    return <Shell><p className="font-display text-2xl uppercase tracking-wide mb-2">Not authorised</p><p className="text-dim text-sm">This area is for admins only.</p></Shell>
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Nav */}
        <nav className="flex items-center justify-between py-5 border-b border-hairline">
          <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity duration-150">
            <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-7 w-auto" />
          </button>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim hidden sm:inline">{displayName} · admin</span>
            <button onClick={signOut} className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint hover:text-acid border border-hairline hover:border-acid px-3 py-2 transition-colors duration-150">Sign out</button>
          </div>
        </nav>

        {/* Header */}
        <div className="py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2">Admin</h1>
          <p className="text-dim text-sm">Registered users and feature access. Changes are enforced by row-level security and the server — this page is the control surface, not the gate.</p>
        </div>

        {error && <div className="border border-red-500/40 bg-surface-2 p-3 text-[13px] text-red-300 mb-5">{error}</div>}

        {/* Global kill switch */}
        <div className="flex items-center justify-between border border-hairline bg-surface p-4 mb-6">
          <div>
            <p className="font-display text-sm uppercase tracking-wide text-ink mb-0.5">Downloader — global</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{downloadsEnabled ? 'Enabled for permitted users' : 'Disabled for everyone'}</p>
          </div>
          <button
            onClick={toggleGlobal}
            disabled={savingSwitch}
            className={`w-14 h-7 rounded-full relative transition-colors duration-150 ${downloadsEnabled ? 'bg-acid' : 'bg-white/10'} disabled:opacity-50`}
            aria-label="Toggle downloads globally"
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-base transition-transform duration-150 ${downloadsEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* User table */}
        {loading ? (
          <div className="text-center py-16 text-faint font-mono text-xs uppercase tracking-widest">Loading…</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-faint font-mono text-xs uppercase tracking-widest">No users.</div>
        ) : (
          <div className="border border-hairline overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-hairline">
                  {['User', 'Email', 'Signed up', 'Last sign-in', 'Role', 'Download'].map(h => (
                    <th key={h} className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-hairline last:border-0 hover:bg-surface transition-colors duration-150">
                    <td className="px-4 py-3 text-[13px] text-ink">{u.display_name || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-dim font-mono">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-dim font-mono">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-[12px] text-dim font-mono">{fmtDate(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 border ${u.role === 'admin' ? 'text-acid border-acid/40' : 'text-faint border-hairline'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleDownload(u)}
                        disabled={savingId === u.id || u.role === 'admin'}
                        title={u.role === 'admin' ? 'Admins always have access' : ''}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-150 ${u.can_download ? 'bg-acid' : 'bg-white/10'} disabled:opacity-50`}
                        aria-label="Toggle download access"
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-base transition-transform duration-150 ${u.can_download ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pb-16" />
      </div>
    </div>
  )
}

function Shell({ children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity duration-150">
          <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-7 w-auto" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-24 text-center">
        <div>{children}</div>
      </div>
    </div>
  )
}
