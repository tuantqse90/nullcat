import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static site — deploy tĩnh lên GitHub Pages / bất kỳ CDN nào
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
