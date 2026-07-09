/**
 * Next calls register() once, before the first request is served.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertSessionSecret } = await import("./lib/server/secret");
  const { runMigrations } = await import("./lib/server/migrate");

  try {
    assertSessionSecret();
    // Apply any pending DB migrations before serving. Idempotent; a no-op once
    // the schema is current. Fails the boot loudly if the database is
    // unreachable, which is what we want — better than 500ing every request.
    await runMigrations();

    // First boot only: if the store is empty, import the existing JSON — the
    // live mg_data volume during cutover, or the baked data.seed for a fresh
    // start. A no-op once products exist.
    const { isDatabaseEmpty, pickImportDir, importFromDir } = await import(
      "./lib/server/import-json"
    );
    if (await isDatabaseEmpty()) {
      const dir = await pickImportDir();
      if (dir) {
        const counts = await importFromDir(dir);
        console.log(`[boot] imported initial data from ${dir}:`, counts);
      }
    }
  } catch (err) {
    // Next catches whatever register() throws and leaves the process listening,
    // 500ing every route. That already fails closed — but a container that
    // exits is far easier to diagnose than one that sits "unhealthy":
    // `docker compose up --wait` fails immediately and `docker logs` shows one
    // line instead of a stack trace.
    console.error(`\n[boot] ${(err as Error).message}\n`);
    process.exit(1);
  }
}
