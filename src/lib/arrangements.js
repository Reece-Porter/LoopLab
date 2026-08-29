import { supabase } from './supabase'

// Shape of a serialised arrangement stored in the `data` JSON column.
// We persist the pattern/sample grids + bar count + per-lane volumes, which is
// everything needed to rebuild a "Build Your Own" arrangement. Personal vocal
// recordings are intentionally NOT included (they're large local audio blobs).
export function serialiseArrangement({ genreId, bars, grid, sampleGrid, volumes }) {
  return { v: 1, genreId, bars, grid: grid || {}, sampleGrid: sampleGrid || {}, volumes: volumes || {} }
}

// Publish (or save privately) the current arrangement for the signed-in user.
export async function saveArrangement({ title, description, genreId, isPublic, data }) {
  if (!supabase) throw new Error('Backend not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in')
  const row = {
    user_id: user.id,
    author_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Producer',
    title: title.trim().slice(0, 80),
    description: (description || '').trim().slice(0, 400),
    genre_id: genreId || null,
    is_public: !!isPublic,
    data,
  }
  const { data: inserted, error } = await supabase.from('arrangements').insert(row).select().single()
  if (error) throw error
  return inserted
}

// All public arrangements, newest first (the community gallery).
export async function listPublicArrangements({ limit = 60 } = {}) {
  if (!supabase) throw new Error('Backend not configured')
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// The signed-in user's own arrangements (public + private).
export async function listMyArrangements() {
  if (!supabase) throw new Error('Backend not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteArrangement(id) {
  if (!supabase) throw new Error('Backend not configured')
  const { error } = await supabase.from('arrangements').delete().eq('id', id)
  if (error) throw error
}

// ── Likes ────────────────────────────────────────────────────────────────────

export async function toggleLike(arrangementId) {
  if (!supabase) throw new Error('Backend not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to like arrangements')
  const { data: existing } = await supabase
    .from('likes').select('id').eq('arrangement_id', arrangementId).eq('user_id', user.id).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('likes').delete().eq('id', existing.id)
    if (error) throw error
    return false
  } else {
    const { error } = await supabase.from('likes').insert({ arrangement_id: arrangementId, user_id: user.id })
    if (error) throw error
    return true
  }
}

export async function getLikesForArrangements(ids) {
  if (!supabase || !ids.length) return {}
  const { data: { user } } = await supabase.auth.getUser()
  const { data: counts } = await supabase.from('likes').select('arrangement_id').in('arrangement_id', ids)
  const { data: mine } = user
    ? await supabase.from('likes').select('arrangement_id').in('arrangement_id', ids).eq('user_id', user.id)
    : { data: [] }
  const result = {}
  ids.forEach(id => { result[id] = { count: 0, liked: false } })
  ;(counts || []).forEach(r => { result[r.arrangement_id].count++ })
  ;(mine || []).forEach(r => { result[r.arrangement_id].liked = true })
  return result
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(arrangementId) {
  if (!supabase) throw new Error('Backend not configured')
  const { data, error } = await supabase
    .from('comments').select('*').eq('arrangement_id', arrangementId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addComment(arrangementId, body) {
  if (!supabase) throw new Error('Backend not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to comment')
  const row = {
    arrangement_id: arrangementId,
    user_id: user.id,
    author_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Producer',
    body: body.trim().slice(0, 500),
  }
  const { data, error } = await supabase.from('comments').insert(row).select().single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId) {
  if (!supabase) throw new Error('Backend not configured')
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function getCommentCounts(ids) {
  if (!supabase || !ids.length) return {}
  const { data } = await supabase.from('comments').select('arrangement_id').in('arrangement_id', ids)
  const result = {}
  ids.forEach(id => { result[id] = 0 })
  ;(data || []).forEach(r => { result[r.arrangement_id]++ })
  return result
}

// ── MIDI uploads ─────────────────────────────────────────────────────────────

export async function uploadMidi({ file, title, description, isPublic }) {
  if (!supabase) throw new Error('Backend not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to upload')
  const ext = file.name.endsWith('.mid') || file.name.endsWith('.midi') ? file.name.split('.').pop() : 'mid'
  const path = `${user.id}/${Date.now()}.${ext}`
  const { error: uploadErr } = await supabase.storage.from('midi').upload(path, file, { contentType: 'audio/midi' })
  if (uploadErr) throw uploadErr
  const { data: { publicUrl } } = supabase.storage.from('midi').getPublicUrl(path)
  const author = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Producer'
  const row = {
    user_id: user.id,
    author_name: author,
    title: title.trim().slice(0, 80),
    description: (description || '').trim().slice(0, 400),
    is_public: !!isPublic,
    source_type: 'midi_upload',
    midi_url: publicUrl,
    data: { v: 1, source_type: 'midi_upload' },
  }
  const { data, error } = await supabase.from('arrangements').insert(row).select().single()
  if (error) throw error
  return data
}

// Hand an arrangement to the builder: stashed in sessionStorage and picked up by
// CustomArrangement when the matching genre page mounts.
const LOAD_KEY = 'looplab-load-arrangement'
export function stageArrangementForLoad(record) {
  try { sessionStorage.setItem(LOAD_KEY, JSON.stringify(record)) } catch (e) { /* ignore */ }
}
export function takeStagedArrangement(genreId) {
  try {
    const raw = sessionStorage.getItem(LOAD_KEY)
    if (!raw) return null
    const rec = JSON.parse(raw)
    const data = rec.data || rec
    if (genreId && data.genreId && data.genreId !== genreId) return null
    sessionStorage.removeItem(LOAD_KEY)
    return data
  } catch (e) { return null }
}
