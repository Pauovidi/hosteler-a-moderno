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
  async redirects() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const redirectsPath = path.join(process.cwd(), 'out/redirects.json');

      if (fs.existsSync(redirectsPath)) {
        const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
        return redirects;
      }
    } catch (e) {
      console.warn('Redirects file not found or invalid:', e.message);
    }
    return [];
  },
}

export default nextConfig
