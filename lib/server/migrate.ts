import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import path from "path";

/**
 * Apply pending SQL migrations from ./drizzle. Called once at server boot
 * (instrumentation.ts), before the first request. `migrate()` records applied
 * migrations in a __drizzle_migrations table, so it is idempotent and a no-op
 * once the database is up to date.
 *
 * Uses its own single-connection client and closes it — the app's pool in
 * db.ts is separate and stays open for request traffic.
 */
export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is not set; cannot run migrations.");
    }
    console.warn("[migrate] DATABASE_URL unset — skipping migrations (dev).");
    return;
  }

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("[migrate] database is up to date.");
  } finally {
    await client.end();
  }
}
