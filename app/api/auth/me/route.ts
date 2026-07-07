import { getCurrentAdmin } from "@/lib/server/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  return Response.json({ ok: true, data: admin });
}
