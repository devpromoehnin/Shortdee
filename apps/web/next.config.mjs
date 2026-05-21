import { config } from 'dotenv'

// Monorepo: env vars live in the repo-root .env.local, not apps/web.
// Load them before Next reads process.env (NEXT_PUBLIC_* get inlined at build).
config({ path: '../../.env.local' })

const env = globalThis.process.env
const API_ORIGIN = env.API_ORIGIN ?? 'http://localhost:3001'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript — transpile them.
  transpilePackages: ['@clipdee/ui', '@clipdee/types'],
  // Same-origin proxy to the API gateway — avoids CORS and lets the app run
  // behind an HTTPS tunnel (ngrok) with no mixed-content errors.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }]
  },
  // Allow the dev server to be reached through a tunnel host (ngrok).
  allowedDevOrigins: env.NGROK_HOST ? [env.NGROK_HOST] : [],
}

export default nextConfig
