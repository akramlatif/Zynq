/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",

  // ─── Workbox Runtime Caching Strategies ───────────────────
  runtimeCaching: [
    // 1. Static assets — Cache First (fonts, images, CSS, JS)
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|ico|webp|woff2?|ttf|eot|css|js)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "zynq-static-assets",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // 2. Google Fonts — Cache First
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "zynq-google-fonts",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // 3. GET API responses — Network First (fall back to cache when offline)
    {
      urlPattern: /^https?:\/\/.*\/api\/.*$/i,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "zynq-api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 4. Next.js pages — Network First
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "zynq-next-data",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
});

const nextConfig = withPWA({
  reactStrictMode: true,

  // Removed standalone output as it causes issues in this workspace setup
  optimizeFonts: false,

  // API proxy to backend in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:5000/api/v1"}/:path*`,
      },
    ];
  },

  // Internationalization (Urdu + English)
  i18n: {
    locales: ["en", "ur"],
    defaultLocale: "en",
    localeDetection: false,
  },
});

module.exports = nextConfig;
