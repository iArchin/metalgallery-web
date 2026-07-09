import { getCurrentAdmin, getCurrentCustomer } from "@/lib/server/auth";

export async function GET() {
  const [admin, customer] = await Promise.all([getCurrentAdmin(), getCurrentCustomer()]);
  return Response.json({ ok: true, data: { admin, customer } });
}
