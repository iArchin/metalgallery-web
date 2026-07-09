import "server-only";

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
 * The client IP, from the one header the edge proxy is known to overwrite.
 *
 * X-Real-IP is set to the immediate peer by both proxies we support: nginx
 * (`proxy_set_header X-Real-IP $remote_addr`, which Nginx Proxy Manager emits
 * for every host) and Caddy (`header_up X-Real-IP {remote_host}` in
 * deploy/edge/Caddyfile). A client cannot forge it.
 *
 * X-Forwarded-For is only a fallback, and a poor one: nginx's
 * `$proxy_add_x_forwarded_for` APPENDS the peer to whatever the client sent, so
 * the leftmost entry is attacker-controlled. Reading it first would let anyone
 * rotate a fake IP per request and walk straight through this limiter — and the
 * limiter is what stands between a script and your SMS.ir balance. We take the
 * rightmost entry instead, which the proxy appended itself.
 */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

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
