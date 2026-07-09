import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone: a self-contained server.js plus only the traced
  // node_modules, so the production image ships neither the full npm tree nor
  // the Next CLI. The Dockerfile still copies public/ and .next/static, which
  // standalone deliberately leaves behind.
  output: "standalone",

  // All imagery is local (see app/utils/images.ts), so the optimizer never
  // reaches a remote host — which matters on a filtered network.
  images: {
    remotePatterns: [],
  },

  /**
   * Mount the admin panel at the root of any `admin.*` host.
   *
   * This is a host-matched rewrite rather than a `NextResponse.rewrite()` in
   * middleware, because the two are not equivalent under `output: "standalone"`.
   * There, `req.nextUrl` reports the server's own socket (localhost:3000) while
   * Next compares rewrite targets against the origin the request arrived on, so
   * every absolute rewrite URL is judged foreign and gets *proxied* — the server
   * fetches itself, over TLS if a proxy set X-Forwarded-Proto, and the panel
   * 500s with EPROTO. A config rewrite is resolved inside the router: no origin
   * comparison, no proxy, and the Host header survives for getAdminBase().
   *
   * `/api` and `/_next` are excluded, and `/admin` is excluded so the prefix can
   * never be applied twice (middleware redirects it away first).
   */
  async rewrites() {
    const onAdminHost = [{ type: "host" as const, value: "admin\\..*" }];
    return {
      beforeFiles: [
        { source: "/", has: onAdminHost, destination: "/admin" },
        {
          source: "/:path((?!api|_next|admin).*)",
          has: onAdminHost,
          destination: "/admin/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
