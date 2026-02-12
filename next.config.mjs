/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.palbincdn.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },

  async rewrites() {
    return [
      // Legacy category pages (keep URL exactly like the old site)
      {
        source: '/c:id(\\d+)-:legacySlug.html',
        destination: '/legacy-category/:id?slug=:legacySlug',
      },
      // Legacy product pages (keep URL exactly like the old site)
      {
        source: '/p:id(\\d+)-:legacySlug.html',
        destination: '/legacy-product/:id?slug=:legacySlug',
      },
      // Optional robustness: product legacy URL without slug
      {
        source: '/p:id(\\d+).html',
        destination: '/legacy-product/:id',
      },
    ];
  },

  async redirects() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const redirectsPath = path.join(process.cwd(), 'out/redirects.json');

      if (fs.existsSync(redirectsPath)) {
        const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
        return Array.isArray(redirects) ? redirects : [];
      }
    } catch (e) {
      console.warn('Redirects file not found or invalid:', e?.message || e);
    }
    return [];
  },
};

export default nextConfig;
