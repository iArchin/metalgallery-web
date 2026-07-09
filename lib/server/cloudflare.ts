import "server-only";

/**
 * Cloudflare's published edge ranges, from https://www.cloudflare.com/ips/
 *
 * Used to decide whether `CF-Connecting-IP` can be believed. The header is set
 * by Cloudflare and overwritten on every request — but only for traffic that
 * actually passes through Cloudflare. Anyone can reach this server's public IP
 * directly and invent one, so it is trusted only when the immediate peer is a
 * Cloudflare address.
 *
 * These change rarely, and a stale list fails safe: an unknown peer means we
 * fall back to the peer address itself, which is never spoofable. Refresh with:
 *   curl https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6
 */
const CLOUDFLARE_V4 = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
] as const;

const CLOUDFLARE_V6 = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
] as const;

/** An IPv4 dotted quad as a 32-bit number, or null if it isn't one. */
function v4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const b = Number(p);
    if (b > 255) return null;
    n = n * 256 + b;
  }
  return n >>> 0;
}

// BigInt literals (0n) need an ES2020 target; the project's is older, so build
// the constants explicitly rather than move the whole target for one file.
const ZERO = BigInt(0);
const HEXTET_BITS = BigInt(16);
const V6_BITS = BigInt(128);

/** An IPv6 address as a 128-bit BigInt, or null. Handles "::" compression. */
function v6ToBigInt(ip: string): bigint | null {
  const stripped = ip.replace(/^\[|\]$/g, "").split("%")[0];
  if (!stripped.includes(":")) return null;

  const [head, tail] = stripped.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  if (stripped.includes("::")) {
    const fill = 8 - headParts.length - tailParts.length;
    if (fill < 0) return null;
    headParts.push(...Array(fill).fill("0"), ...tailParts);
  } else if (headParts.length !== 8) {
    return null;
  }

  let n = ZERO;
  for (const part of headParts) {
    if (!/^[0-9a-fA-F]{0,4}$/.test(part)) return null;
    n = (n << HEXTET_BITS) | BigInt(parseInt(part || "0", 16));
  }
  return n;
}

function inV4Cidr(ip: number, cidr: string): boolean {
  const [net, bitsRaw] = cidr.split("/");
  const base = v4ToInt(net);
  if (base === null) return false;
  const bits = Number(bitsRaw);
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (base & mask);
}

function inV6Cidr(ip: bigint, cidr: string): boolean {
  const [net, bitsRaw] = cidr.split("/");
  const base = v6ToBigInt(net);
  if (base === null) return false;
  const shift = V6_BITS - BigInt(bitsRaw);
  return ip >> shift === base >> shift;
}

/** Did this request reach us through Cloudflare's edge? */
export function isCloudflareIp(ip: string): boolean {
  const v4 = v4ToInt(ip);
  if (v4 !== null) return CLOUDFLARE_V4.some((c) => inV4Cidr(v4, c));

  const v6 = v6ToBigInt(ip);
  if (v6 !== null) return CLOUDFLARE_V6.some((c) => inV6Cidr(v6, c));

  return false;
}
