import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Required for Prisma to run on Cloudflare Workers — OpenNext patches the
  // generated client to use a workerd-compatible engine when it's external.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    domains: ['media.themoviedb.org', 'image.tmdb.org', 'm.media-amazon.com', 'images.unsplash.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Image optimization runs through the Cloudflare Images binding (IMAGES)
    // defined in wrangler.jsonc. Requires Cloudflare Images enabled on the
    // account — see README "Cloudflare Images".
  },
}

export default nextConfig

initOpenNextCloudflareForDev()
