/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.palbincdn.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
}

export default nextConfig
