/** @type {import('next').NextConfig} */

// Use basePath only in production build, not in development
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/Projects/elevation' : '';

const nextConfig = {
  output: 'export',
  basePath: basePath,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  devIndicators: false,
  allowedDevOrigins: [
    "*.macaly.dev",
    "*.macaly.app",
    "*.macaly-app.com",
    "*.macaly-user-data.dev",
  ],
  // Workaround pro Next.js 15 static export bug s .nft.json
  experimental: {
    outputFileTracingIncludes: {},
  },
};

module.exports = nextConfig;
