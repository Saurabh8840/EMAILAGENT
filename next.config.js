import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: false,         // Disable LightningCSS
    // @ts-ignore
    optimizePackageImports: false,
  },
  tailwind: {
    disableOxide: true,         // Disable Tailwind native binaries
  },
};

export default config;