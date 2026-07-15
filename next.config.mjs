import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withSentryConfig } from '@sentry/nextjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jspdfBrowser = path.join(__dirname, 'node_modules/jspdf/dist/jspdf.es.min.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force browser build of jspdf (default "main" is node and breaks SSR/Turbopack with fflate Workers)
  turbopack: {
    resolveAlias: {
      jspdf: './node_modules/jspdf/dist/jspdf.es.min.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      jspdf: jspdfBrowser,
    }
    return config
  },
}

export default withSentryConfig(nextConfig, {
  org: "ipo-pc",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
