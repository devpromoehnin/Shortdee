/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript — transpile them.
  transpilePackages: ['@clipdee/ui', '@clipdee/types'],
}

export default nextConfig
