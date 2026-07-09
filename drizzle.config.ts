import type { Config } from "drizzle-kit";

/**
 * drizzle-kit config — used at DEV time only, to generate SQL migrations from
 * lib/server/schema.ts into ./drizzle. The runtime image does not include
 * drizzle-kit; migrations are applied by lib/server/migrate.ts.
 *
 *   npx drizzle-kit generate   # after editing schema.ts
 */
export default {
  schema: "./lib/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/metalgallery",
  },
  strict: true,
} satisfies Config;
