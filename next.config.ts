import type { Configuration as WebpackConfiguration } from 'webpack';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lottery-85f3f.firebasestorage.app'
    ],
    minimumCacheTTL: 1800,
  },
  experimental: {
    strictNextHead: true,
    // Improve handling of dynamic routes
    scrollRestoration: true,
  },
  // Enable shallow routing for better direct link handling
  trailingSlash: false,
  // Properly typed webpack configuration
  webpack: (config: WebpackConfiguration) => {
    return config;
  },
  // Add custom headers to improve caching and loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: https://firebasestorage.googleapis.com https://lottery-85f3f.firebasestorage.app; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://*.firebaseio.com https://*.firebase.com https://*.firebasestorage.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://*.firebasestorage.app ws: wss: http: https:; frame-src 'self'; media-src 'self';"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Add Cache-Control headers for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
