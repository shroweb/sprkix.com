import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default {
  ...defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
  }),
  // Command OpenNext runs internally to build the Next.js app. Kept explicit
  // and decoupled from the `build` npm script (which is `opennextjs-cloudflare
  // build` itself) to avoid recursion on Cloudflare Workers Builds, where the
  // platform runs `npm run build` and then `wrangler deploy`.
  buildCommand: "pnpm exec next build",
};
