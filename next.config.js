/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
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
    "elevationeditor.com",
    "*.elevationeditor.com",
  ],
  // Workaround pro Next.js 15 static export bug s .nft.json
  experimental: {
    outputFileTracingIncludes: {},
  },
};

module.exports = nextConfig;
