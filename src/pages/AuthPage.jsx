import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, configured, user } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in → bounce to home
  if (user) {
    navigate('/')
    return null
  }

  async function submit(e) {
    e.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
        setNotice('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError(''); setBusy(true)
    try { await signInWithGoogle() } // redirects away
    catch (err) { setError(err.message || 'Google sign-in failed'); setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity duration-150">
          <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-8 w-auto" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-center mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-dim text-sm text-center mb-7">
            {mode === 'signin' ? 'Sign in to save and share your arrangements.' : 'Save your arrangements and publish them to the community.'}
          </p>

          {!configured && (
            <div className="mb-5 border border-hairline bg-surface-2 p-3 text-[12px] text-dim">
              Accounts aren't set up yet. The site owner needs to add Supabase keys in <code>src/lib/supabaseConfig.js</code>.
            </div>
          )}

          {error && <div className="mb-4 border border-red-500/40 bg-surface-2 p-3 text-[12px] text-red-300">{error}</div>}
          {notice && <div className="mb-4 border border-acid/40 bg-surface-2 p-3 text-[12px] text-acid">{notice}</div>}

          {/* Google */}
          <button
            onClick={google}
            disabled={busy || !configured}
            className="w-full flex items-center justify-center gap-2.5 bg-ink text-base font-mono uppercase tracking-[0.1em] text-[12px] px-4 py-3 hover:bg-white transition-colors duration-150 disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-hairline" />
            <span className="font-mono text-[11px] text-faint uppercase tracking-[0.2em]">or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          {/* Email form */}
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
              />
            )}
            <input
              type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
            />
            <input
              type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              minLength={6}
              className="w-full bg-surface-2 border border-hairline px-4 py-3 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
            />
            <button
              type="submit" disabled={busy || !configured}
              className="w-full bg-acid hover:bg-acid-dim text-base font-display font-semibold uppercase tracking-wide text-sm px-4 py-3 transition-colors duration-150 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-dim mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice('') }}
              className="text-acid hover:text-ink font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
