import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow real toy imagery loaded from the internet. Product/section images
    // are rendered with plain <img>, but these patterns keep next/image usage
    // (or future migration) working too.
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
