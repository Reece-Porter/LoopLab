# LoopLab audio service — Node + yt-dlp + ffmpeg + Demucs (vocal isolation)
FROM node:20-slim

# ffmpeg (mp3 extraction + Demucs I/O), python3/pip, build tools (some Demucs
# deps have no prebuilt wheel), libsndfile (soundfile runtime) and yt-dlp.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pip python3-dev build-essential libsndfile1 ca-certificates wget && \
    wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Demucs on the CPU-only PyTorch wheels — MUCH smaller than the default CUDA
# build. torch AND torchaudio must come from the CPU index together (Demucs
# needs torchaudio; pulling it from PyPI would drag in the CUDA build). Pinned
# to versions with cp311 CPU wheels so nothing builds from source.
# --break-system-packages: Debian bookworm's pip is PEP-668 locked.
RUN pip3 install --no-cache-dir --break-system-packages --upgrade pip && \
    pip3 install --no-cache-dir --break-system-packages \
      --index-url https://download.pytorch.org/whl/cpu \
      torch==2.2.2 torchaudio==2.2.2 && \
    pip3 install --no-cache-dir --break-system-packages demucs==4.0.1

# Bake the model weights into the image so the first request doesn't stall
# downloading ~80 MB (and so a cold box works offline).
RUN python3 -c "from demucs.pretrained import get_model; get_model('htdemucs')"

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
