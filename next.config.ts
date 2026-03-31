import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    qualities: [75, 85, 90], // add every value you use across your <Image> components
  },
};

export default nextConfig;
