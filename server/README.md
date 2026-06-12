# LoopLab Audio Service

A tiny backend that lets the DJ Deck **download and EQ** SoundCloud / YouTube
tracks. It uses [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) to fetch the audio
stream and re-serves it as MP3 with CORS headers, which is the only way a
browser-based deck can process that audio.

> ⚠️ Only download audio you have the right to — your own uploads, Creative
> Commons tracks, or tracks where the artist enabled downloads. SoundCloud and
> YouTube terms prohibit downloading otherwise.

## Endpoints

| Route | What it does |
|-------|--------------|
| `GET /api/fetch?url=<track>` | Streams the track as MP3 (download + EQ) |
| `GET /api/info?url=<track>`  | Returns `{ title, uploader, duration }` |
| `GET /health`                | Health check |

---

## Deploy to Render (free) — step by step

1. **Push this repo to GitHub** (already done if you're reading this on GitHub).
2. Go to <https://dashboard.render.com> and sign in with GitHub.
3. Click **New +** → **Blueprint**.
4. Select this repository. Render reads `server/render.yaml` and proposes a
   service called **looplab-audio**. Click **Apply**.
5. Wait for the first build (it installs ffmpeg + yt-dlp via Docker — a few
   minutes). When it's live you'll get a URL like
   `https://looplab-audio.onrender.com`.
6. **Copy that URL.** Open the DJ Deck on your site, click **⚙ Backend**, paste
   it in, and Save. SoundCloud/YouTube links now download and EQ.
7. *(Optional, recommended)* In Render → your service → **Environment**, set
   `ALLOWED_ORIGIN` to your site origin (e.g. `https://reece-porter.github.io`)
   so only your site can call it. Save → it redeploys.

> The Render free tier sleeps after inactivity, so the **first** request after a
> while takes ~30–50s to wake up. Subsequent requests are fast.

## Run locally

```bash
cd server
npm install
# needs yt-dlp + ffmpeg on PATH:
#   brew install yt-dlp ffmpeg        (macOS)
#   sudo apt install ffmpeg && pipx install yt-dlp   (Linux)
npm start
# → http://localhost:3000
```

Then set the DJ Deck backend URL to `http://localhost:3000`.
