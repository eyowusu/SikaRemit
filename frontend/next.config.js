const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove rewrites for production - use direct API calls
  async rewrites() {
    // Only add rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/django/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production'
  },
  experimental: {
    optimizeCss: true,
  },
  // Output standalone for Docker deployment
  output: 'standalone',
}

module.exports = withBundleAnalyzer(nextConfig);
