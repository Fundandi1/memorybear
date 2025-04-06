/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true,
  },
  // Remove rewrites since we're serving from same origin
  async rewrites() {
    return []
  },
  // Update asset prefix to match Django static URL
  assetPrefix: '/_next',
  // Disable directory index
  trailingSlash: false,
}

module.exports = nextConfig
