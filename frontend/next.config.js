/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'placekitten.com'], // Add any domains you need for external images
  },
}

module.exports = nextConfig 