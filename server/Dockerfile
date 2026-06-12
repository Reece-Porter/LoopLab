# LoopLab audio service — Node + yt-dlp + ffmpeg
FROM node:20-slim

# ffmpeg (for mp3 extraction) and python/yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates wget && \
    wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
