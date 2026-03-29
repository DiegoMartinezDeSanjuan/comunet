import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    // Note: 'unsafe-inline' is currently kept for Next.js App Router internal scripts and hydration. 
    // 'unsafe-eval' is needed for Turbopack/development environment.
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",
  },
]

const nextConfig: NextConfig = {
  // Security headers on all routes
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const scriptSrc = isDev 
      ? "'self' 'unsafe-inline' 'unsafe-eval'" 
      : "'self' 'unsafe-inline'"

    // Update the CSP within the headers array dynamically
    const dynamicHeaders = securityHeaders.map(header => {
      if (header.key === 'Content-Security-Policy') {
        return {
          key: header.key,
          value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';`
        }
      }
      return header
    })

    return [
      {
        source: '/(.*)',
        headers: dynamicHeaders,
      },
    ]
  },

  // Optimize for production
  poweredByHeader: false,

  // Increase body size limit for file uploads (8MB matches Document service limit)
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },

  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
};

export default nextConfig;
