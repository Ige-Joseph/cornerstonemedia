/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudinary CDN — production image storage
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Local backend dev server — serves /uploads/* static files
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      // Unsplash — demo/placeholder images
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Generic production backend (replace with your actual domain)
      { protocol: 'https', hostname: '*.cornerstonemedia.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// Expose site URL for sitemap generation
// Set NEXT_PUBLIC_SITE_URL in your production environment
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cornerstonemedia.com';

module.exports = nextConfig;
