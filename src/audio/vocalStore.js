// IndexedDB store for user vocal clips.
// Each clip is { id, name, buffer: AudioBuffer, createdAt }.
// AudioBuffer can't be stored directly; we serialise as raw PCM Float32Arrays.

const DB_NAME    = 'looplab-vocals'
const DB_VERSION = 1
const STORE      = 'clips'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

// Serialise an AudioBuffer to a plain object we can store.
function serialise(name, buffer) {
  const channels = []
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(Array.from(buffer.getChannelData(c)))
  }
  return {
    id: `vocal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    sampleRate: buffer.sampleRate,
    length: buffer.length,
    channels,
    createdAt: Date.now(),
  }
}

// Reconstruct an AudioBuffer from the stored object.
export function deserialise(ctx, row) {
  const buf = ctx.createBuffer(row.channels.length, row.length, row.sampleRate)
  row.channels.forEach((ch, i) => buf.copyToChannel(new Float32Array(ch), i))
  return buf
}

export async function saveClip(name, audioBuffer) {
  const db   = await openDb()
  const row  = serialise(name, audioBuffer)
  await new Promise((res, rej) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(row)
    req.onsuccess = res; req.onerror = rej
  })
  return row.id
}

export async function loadAllClips() {
  const db = await openDb()
  return new Promise((res, rej) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = e => res(e.target.result)
    req.onerror   = rej
  })
}

export async function deleteClip(id) {
  const db = await openDb()
  return new Promise((res, rej) => {
    const tx  = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(id)
    req.onsuccess = res; req.onerror = rej
  })
}
