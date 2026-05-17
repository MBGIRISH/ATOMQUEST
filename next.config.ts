import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow hot module reloading when testing over the local network
  allowedDevOrigins: ["10.249.12.11", "localhost", "127.0.0.1"],
} as any;

export default nextConfig;
