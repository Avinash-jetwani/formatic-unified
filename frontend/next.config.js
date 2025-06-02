/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'placekitten.com'], // Add any domains you need for external images
  },
  // Disable caching in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 5 * 1000, // 5 seconds
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Ensure we're not using stale data
  staticPageGenerationTimeout: 1000,
  webpack: (config, { dev, isServer }) => {
    // For development, disable caching
    if (dev) {
      config.cache = false;
      // Force webpack to reevaluate modules
      config.module.unsafeCache = false;
      // Disable webpack caching
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        minimize: false,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            default: false,
          },
        },
      };
    }
    return config;
  },
  // Force full refresh on route changes in development
  experimental: {
    isrFlushToDisk: false,
  },
  output: 'standalone',
  // Allow API requests to backend
  async rewrites() {
    // In production, Nginx handles /api routing, so we don't need rewrites
    // In development, we need to proxy to the backend
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig 