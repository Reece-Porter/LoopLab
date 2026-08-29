# LoopLab audio service — Node + yt-dlp + ffmpeg + Demucs (vocal isolation)
FROM node:20-slim

# ffmpeg (mp3 extraction + Demucs I/O), python3/pip and yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pip ca-certificates wget && \
    wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Demucs on the CPU-only PyTorch wheel (keeps the image far smaller than the
# CUDA build). --break-system-packages: Debian bookworm's pip is PEP-668 locked.
RUN pip3 install --no-cache-dir --break-system-packages \
      --index-url https://download.pytorch.org/whl/cpu torch && \
    pip3 install --no-cache-dir --break-system-packages demucs

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
