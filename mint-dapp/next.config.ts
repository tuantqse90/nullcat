import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static site — deploy to GitHub Pages / any CDN
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
