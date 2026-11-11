import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Subdomain WCC menampilkan landing page di alamat utamanya.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", has: [{ type: "host", value: "wcc.momentumluna.my.id" }], destination: "/wcc" }],
    };
  },
};

export default nextConfig;
