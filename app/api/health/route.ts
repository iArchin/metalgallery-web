/**
 * Liveness probe for the Docker HEALTHCHECK and `docker compose up --wait`.
 *
 * Touches no collection on purpose: this must answer while the data volume is
 * still being seeded, and it must not turn a slow disk into a failed deploy.
 * Middleware skips /api, so it serves identically on both hosts.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
