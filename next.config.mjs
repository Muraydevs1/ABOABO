/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        unoptimized: true
    },
    experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-neon"
    ]
  }
};

export default nextConfig;
