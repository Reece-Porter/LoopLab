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
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoopLab" width={28} height={28} className="h-7 w-7 rounded-md" />
          <span className="font-semibold text-white text-sm">LoopLab</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-1.5">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-7">
            {mode === 'signin' ? 'Sign in to save and share your arrangements.' : 'Save your arrangements and publish them to the community.'}
          </p>

          {!configured && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-300">
              Accounts aren't set up yet. The site owner needs to add Supabase keys in <code>src/lib/supabaseConfig.js</code>.
            </div>
          )}

          {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-300">{error}</div>}
          {notice && <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] text-emerald-300">{notice}</div>}

          {/* Google */}
          <button
            onClick={google}
            disabled={busy || !configured}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-gray-800 font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-gray-100 transition disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-gray-600 uppercase tracking-wider">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email form */}
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 transition"
              />
            )}
            <input
              type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 transition"
            />
            <input
              type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              minLength={6}
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c5cfc]/60 transition"
            />
            <button
              type="submit" disabled={busy || !configured}
              className="w-full bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white font-medium text-sm rounded-lg px-4 py-2.5 transition disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice('') }}
              className="text-[#a78bfa] hover:text-[#c4b5fd] font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
