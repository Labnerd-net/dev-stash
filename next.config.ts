import type { NextConfig } from "next";

// initOpenNextCloudflareForDev wires up Cloudflare bindings during `next dev`
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
