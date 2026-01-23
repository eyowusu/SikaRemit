const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isExport = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations - only use export for production builds
  ...(isExport && { output: 'export' }),
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,
  
  // Exclude specific routes from static generation
  experimental: {
    optimizeCss: true,
    missingSuspenseCSSToken: true,
  },
  
  // Rewrites only in development (not compatible with static export)
  ...(!isExport && {
    async rewrites() {
      return [
        {
          source: '/api/django/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    },
    // Security headers (only in dev, use hosting provider headers in production)
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          ],
        },
      ];
    },
  }),
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  experimental: {
    optimizeCss: true,
  },
  
  // Image optimization
  images: {
    domains: ['api.sikaremit.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  serverExternalPackages: [],
  
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = withBundleAnalyzer(nextConfig);
