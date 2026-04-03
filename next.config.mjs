/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon"
  ],
};

export default nextConfig;