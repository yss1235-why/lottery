// File: next.config.ts
import type { NextConfig } from 'next';

// Define a simple type for the webpack config function
interface WebpackConfigFn {
  (config: any): any;
}

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
    scrollRestoration: true,
  },
  trailingSlash: false,
  
  // Use a type assertion to handle the webpack configuration
  webpack: (config: any) => {
    return config;
  } as WebpackConfigFn,
  
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
