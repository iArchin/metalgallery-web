import { clearSessionCookie, clearCustomerSessionCookie } from "@/lib/server/auth";

/** Clear a session. Body `{ scope: "admin" | "user" }`; defaults to clearing both. */
export async function POST(req: Request) {
  let scope = "all";
  try {
    const body = await req.json();
    if (body?.scope) scope = String(body.scope);
  } catch {
    // no body → clear everything
  }
  if (scope === "admin" || scope === "all") await clearSessionCookie();
  if (scope === "user" || scope === "all") await clearCustomerSessionCookie();
  return Response.json({ ok: true, data: null });
}
