import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["cheerio", "jszip", "@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/extract": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/playwright-core/package.json",
      "./node_modules/playwright-core/lib/**/*",
      "./node_modules/playwright-core/index.js",
      "./node_modules/playwright-core/index.mjs",
    ],
    "/api/convert": ["./node_modules/jszip/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
