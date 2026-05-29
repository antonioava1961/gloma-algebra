import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-9e97a52a-54ee-4bfe-bcde-8ad717b5da6d.space.chatglm.site",
  ],
};

export default nextConfig;
