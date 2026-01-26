import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash:true,
  assetPrefix: "./next_static"
};

export default nextConfig;
