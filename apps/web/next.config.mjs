import { config } from 'dotenv'

// Monorepo: env vars live in the repo-root .env.local, not apps/web.
// Load them before Next reads process.env (NEXT_PUBLIC_* get inlined at build).
config({ path: '../../.env.local' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript — transpile them.
  transpilePackages: ['@clipdee/ui', '@clipdee/types'],
}

export default nextConfig
