import "server-only";
import { isCloudflareIp } from "./cloudflare";

/**
 * In-memory fixed-window rate limiter, keyed by client IP.
 *
 * Deliberately process-local: the app is a single container by construction
 * (the JSON DB has an in-process write queue), so there is nothing to share
 * state with. Counters reset on redeploy, which is acceptable for a throttle.
 *
 * This is the only thing standing between a script and your SMS.ir balance —
 * `otp.ts` throttles per phone number, which an attacker simply rotates.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Bounded so a flood of unique IPs can't grow the map without limit.
const MAX_KEYS = 10_000;

function sweep(now: number): void {
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}

/**
 * The client IP, derived only from headers an attacker cannot control.
 *
 * `X-Real-IP` is the immediate peer, written by the proxy on every request:
 * nginx sets `proxy_set_header X-Real-IP $remote_addr` (Nginx Proxy Manager
 * emits this for every host), and Caddy does the same in deploy/edge/Caddyfile.
 * It is the trust anchor here.
 *
 * The site sits behind Cloudflare, so that peer is usually a Cloudflare edge
 * node and the visitor's own address arrives in `CF-Connecting-IP`. That header
 * is only believable when the peer really is Cloudflare — the origin has a
 * public IP, and anyone hitting it directly could otherwise invent one and get
 * a fresh rate-limit bucket per request.
 *
 * `X-Forwarded-For` is a last resort and a poor one: nginx's
 * `$proxy_add_x_forwarded_for` APPENDS the peer to whatever the client sent, so
 * the leftmost entry is attacker-controlled. Take the rightmost, which the
 * proxy appended itself.
 *
 * Getting this wrong is not academic. Read the wrong header and either every
 * visitor in the country shares one bucket (Cloudflare's IP), or every attacker
 * gets an unlimited supply of them — and this limiter is what stands between a
 * script and your SMS.ir balance.
 */
export function clientIp(req: Request): string {
  const peer = req.headers.get("x-real-ip")?.trim();

  if (peer && isCloudflareIp(peer)) {
    const visitor = req.headers.get("cf-connecting-ip")?.trim();
    if (visitor) return visitor;
  }
  if (peer) return peer;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",");
    return hops[hops.length - 1].trim();
  }
  return "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (windows.size > MAX_KEYS) sweep(now);

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** 429 with the Persian message the login form already renders. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "درخواست‌های بیش از حد. لطفاً کمی بعد دوباره تلاش کنید." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
