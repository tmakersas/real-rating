import type { NextConfig } from "next";

// The app lives at https://www.tmaker.io/real-rating (rewrite in tmaker-portfolio),
// so every route and asset is served under this base path.
const BASE = "/real-rating";

const nextConfig: NextConfig = {
  basePath: BASE,
  outputFileTracingIncludes: {
    "/api/og": ["./assets/**/*"],
  },
  images: { unoptimized: true },
  redirects: async () => [
    // Old links on the bare vercel.app domain go to the tmaker.io home of the app.
    {
      source: "/:path((?!real-rating(?:/|$)).*)",
      destination: "https://www.tmaker.io/real-rating/:path",
      permanent: false,
      basePath: false,
    },
  ],
};

export default nextConfig;
