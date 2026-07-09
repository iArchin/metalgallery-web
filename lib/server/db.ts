import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection + Drizzle client.
 *
 * One long-lived pool for the whole process — the app runs as a single
 * standalone Node server, so a normal pool (not a per-request connection) is
 * correct.
 *
 * `postgres()` connects lazily (on first query), so constructing the client
 * here is safe even during `next build`, which runs with NODE_ENV=production and
 * no database. The real DATABASE_URL requirement is enforced at boot by
 * migrate.ts (called from instrumentation.ts) — long before the first query.
 */

const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/metalgallery";

// A modest pool: the single app process shares it across all requests. Idle
// connections are reaped so a quiet site doesn't hold sockets open forever.
const client = postgres(url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Exposed so a migration/health path can close the pool cleanly if it ever
// needs to; the long-running server never calls this.
export const sql = client;
