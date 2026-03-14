/** @type {import('next').NextConfig} */

const nextConfig = {
  // ── Turbopack (replaces Webpack in dev — much faster recompiles) ──
  // Run: next dev --turbopack  OR add to package.json script
  // Already enabled if you use: next dev --turbo

  experimental: {
    allowedDevOrigins: ["https://proto.balon.ai"],

    // Tree-shake heavy packages — faster cold starts
    optimizePackageImports: [
      "@heroui/react",
      "@iconify/react",
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },

  // ── Faster builds: skip type checking & lint in dev ──────────────
  typescript: {
    ignoreBuildErrors: false, // keep true safety in build
  },
  eslint: {
    ignoreDuringBuilds: true, // don't lint on every build
  },

  images: {
    // Cache images longer
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.ufs.sh", pathname: "/**" },
      { protocol: "https", hostname: "*.utfs.sh", pathname: "/**" },
      { protocol: "https", hostname: "*.uploadthing.com", pathname: "/**" },
    ],
  },

  // ── Compress responses ────────────────────────────────────────────
  compress: true,

  // ── Headers: cache static assets aggressively ────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/(.*)\\.(jpg|jpeg|png|webp|svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;