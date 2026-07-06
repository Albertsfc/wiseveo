import type { NextConfig } from "next";
// @ts-ignore
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typescript: {
    // Prisma 7.x generated client has exports map without "types" condition,
    // which breaks Turbopack's bundler-mode TS resolution on Vercel.
    // Types are validated locally by IDE and tsc.
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['@resvg/resvg-js', 'node-telegram-bot-api'],
};

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyzer(withNextIntl(nextConfig));
