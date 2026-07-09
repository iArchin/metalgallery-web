# syntax=docker/dockerfile:1
###############################################################################
# metalgallery-web — production image
#
# Build this OFF the server, on a machine with working internet, then ship it:
#   deploy/ops/deploy.sh   (docker save | ssh | docker load)
#
# The build needs Docker Hub (base image) and the npm registry. It does NOT
# need Google Fonts — Vazirmatn is vendored at app/fonts. It does not need the
# live database either: data/ is excluded from the build context and the
# PII-free data.seed/ is baked in instead.
#
# Everything below assumes linux/amd64, which is what the Parspack VPS runs.
# The explicit --platform means an arm64 laptop (Apple Silicon) still produces
# an image the server can exec, instead of one that dies with "exec format
# error" after a full save + transfer.
###############################################################################

ARG NODE_IMAGE=node:22-bookworm-slim

###############################################################################
# Stage 1 — deps. Full install, devDependencies included: `next build` needs
# tailwindcss, @tailwindcss/postcss and typescript, all of which live there.
# Never add --omit=dev here.
###############################################################################
FROM --platform=linux/amd64 ${NODE_IMAGE} AS deps
WORKDIR /app

# Manifest first, so this layer is cached until dependencies actually change.
COPY package.json package-lock.json ./

# On this Linux stage npm resolves the right optional binary for sharp
# (@img/sharp-linux-x64). A node_modules copied from the Windows host would
# carry the win32 build and fail at runtime — .dockerignore keeps it out.
RUN --mount=type=cache,target=/root/.npm npm ci

###############################################################################
# Stage 2 — builder.
###############################################################################
FROM --platform=linux/amd64 ${NODE_IMAGE} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_SITE_URL is inlined into the CLIENT bundle at build time — it is
# read by app/admin/_components/AdminShell.tsx, a "use client" component, for
# the panel's "view store" link. A runtime env var cannot reach compiled client
# JS, so it must be an ARG here. Change it => rebuild the image.
#
# SESSION_SECRET is deliberately absent: a build arg would be recoverable from
# `docker history`. lib/server/secret.ts validates at boot, not at import, so
# the build stays hermetic without one.
ARG NEXT_PUBLIC_SITE_URL=https://metalgallery.ir
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# /sitemap.xml is prerendered at build time and calls listProducts(), which
# reads data/products.json. The live data/ is excluded from the build context,
# so give the build the scrubbed seed to read. (readCollection also tolerates a
# missing collection now, so this is belt and braces — but it keeps the sitemap
# populated rather than empty.)
RUN cp -r data.seed data

RUN npm run build

###############################################################################
# Stage 3 — runner. Only the standalone server and its assets.
###############################################################################
FROM --platform=linux/amd64 ${NODE_IMAGE} AS runner
WORKDIR /app

# NODE_ENV=production is load-bearing: standalone `node server.js` does not set
# it the way `next start` does, and without it session cookies lose the Secure
# flag. DATA_DIR pins the JSON DB to the mounted volume regardless of cwd.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data \
    TZ=Asia/Tehran

# tini as PID 1. The kernel applies no default signal action to PID 1, so a
# bare node process ignores SIGTERM and every `docker stop` would wait out the
# full grace period before SIGKILL — turning each redeploy into ~10s of downtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app --shell /usr/sbin/nologin nextjs

# standalone omits both of these; copy them or every asset 404s.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The scrubbed seed, not the live DB. The entrypoint copies only the missing
# collections out of it at boot.
COPY --chown=nextjs:nodejs data.seed ./data.seed
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh

# The standalone trace bakes in whatever data/ existed at build time (the seed
# copy above). Delete it: the only data path must be the volume. Recreate the
# mount point empty and owned by nextjs so a fresh named volume inherits that
# ownership and the non-root process can write to it.
# The sed strips CRLF, since the repo is checked out on Windows and a \r in the
# shebang makes the kernel refuse to exec the script.
RUN rm -rf /app/data \
    && mkdir -p /app/data \
    && chown nextjs:nodejs /app/data \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# node:22 has a global fetch(), so no curl/wget needed. /api/health touches no
# collection, so it answers even while the volume is still being seeded.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
