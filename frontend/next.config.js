/****
 * Next.js config with a convenient DEV proxy to your backend API.
 *
 * Usage option A (recommended for dev):
 *  - Set BACKEND_URL in .env.local, e.g. http://localhost:8000/api
 *  - Keep NEXT_PUBLIC_API_URL=/backend (default below)
 *  - All api.ts requests will go to /backend/... and be proxied to BACKEND_URL
 *
 * Usage option B:
 *  - Skip the proxy; set NEXT_PUBLIC_API_URL directly to your full API base
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // DEV proxy: /backend/* -> BACKEND_URL/*
      {
        source: '/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
