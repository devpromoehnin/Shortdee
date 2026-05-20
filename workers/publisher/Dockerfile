# Build context = repo root:  docker build -f workers/publisher/Dockerfile .
FROM node:20-slim

RUN corepack enable

WORKDIR /srv
COPY . .

RUN pnpm install --frozen-lockfile --filter @clipdee/publisher...
RUN pnpm --filter @clipdee/publisher build

CMD ["node", "workers/publisher/dist/index.js"]
