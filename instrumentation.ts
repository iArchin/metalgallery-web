/**
 * Next calls register() once, before the first request is served.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertSessionSecret } = await import("./lib/server/secret");

  try {
    assertSessionSecret();
  } catch (err) {
    // Next catches whatever register() throws and leaves the process listening,
    // 500ing every route. That already fails closed — nothing is ever served
    // with a forgeable session key — but a container that exits is far easier to
    // diagnose than one that sits "unhealthy": `docker compose up --wait` fails
    // immediately and `docker logs` shows one line instead of a stack trace.
    console.error(`\n[boot] ${(err as Error).message}\n`);
    process.exit(1);
  }
}
