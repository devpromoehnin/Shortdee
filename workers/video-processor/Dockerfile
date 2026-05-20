# Build context = repo root:  docker build -f workers/video-processor/Dockerfile .
FROM node:20-slim

# FFmpeg — core of the video pipeline.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /srv
COPY . .

RUN pnpm install --frozen-lockfile --filter @clipdee/video-processor...
RUN pnpm --filter @clipdee/video-processor build

CMD ["node", "workers/video-processor/dist/index.js"]
