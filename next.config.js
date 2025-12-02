/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    allowedDevOrigins: ["https://proto.balon.ai"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/**", // specific path only
      },
      {
        protocol: "https",
        hostname: "*.utfs.sh",
        pathname: "/**", // specific path only
      },
      {
        protocol: "https",
        hostname: "*.uploadthing.com",
        pathname: "/**", // specific path only
      },
    ],
  },
};

module.exports = nextConfig;
