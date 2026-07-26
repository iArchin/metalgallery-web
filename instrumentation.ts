/**
 * Next calls register() once, before the first request is served — in BOTH the
 * Node.js and Edge runtimes (middleware runs on Edge). This file must therefore
 * stay free of Node-only APIs.
 *
 * The real boot work — session-secret assertion, migrations, first-boot import,
 * and a process.exit on failure — lives in ./instrumentation-node, imported
 * only under the Node runtime. Keeping its process.exit out of this module is
 * what stops Next from warning "a Node.js API is used (process.exit) ... not
 * supported in the Edge Runtime" on every request that passes through
 * middleware (the support-chat poll hits it every few seconds).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { boot } = await import("./instrumentation-node");
  await boot();
}
