/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Matches all secure sites
      },
      {
        protocol: 'http',
        hostname: '**', // Matches all non-secure sites (like that Leica link)
      },
    ],
  },
};

export default nextConfig;