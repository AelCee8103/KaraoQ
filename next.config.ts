import type { NextConfig } from "next";

const isPuter = process.env.DEPLOY_TARGET === "puter";

const nextConfig: NextConfig = {
  output: isPuter ? "export" : undefined,
  images: {
    unoptimized: isPuter ? true : false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "*.puter.com",
      },
      {
        protocol: "https",
        hostname: "*.puter.site",
      },
    ],
  },
  trailingSlash: isPuter ? true : false,
  reactStrictMode: true,
};

export default nextConfig;
