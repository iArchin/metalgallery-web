import "server-only";

/**
 * The HMAC key behind every session cookie and every stored OTP hash.
 *
 * A dev fallback keeps `npm run dev` working with no setup, but that same
 * string is public in the repo — anyone holding it can forge an admin session.
 * So production must supply a real secret, and `assertSessionSecret()` (called
 * from instrumentation.ts) refuses to start the server otherwise.
 *
 * Validation is deliberately NOT done at module scope: `next build` imports
 * this file while prerendering, and a build machine has no secret to give.
 */

export const DEV_FALLBACK_SECRET = "metalgallery-dev-secret-change-in-production";

const MIN_LENGTH = 32;

export const SESSION_SECRET = process.env.SESSION_SECRET ?? DEV_FALLBACK_SECRET;

export function assertSessionSecret(): void {
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -hex 32` and put it in the environment."
    );
  }
  if (secret === DEV_FALLBACK_SECRET) {
    throw new Error(
      "SESSION_SECRET is still the development fallback, which is committed to this repository. Generate a real one with `openssl rand -hex 32`."
    );
  }
  if (secret.length < MIN_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be at least ${MIN_LENGTH} characters (got ${secret.length}). Generate one with \`openssl rand -hex 32\`.`
    );
  }
}
