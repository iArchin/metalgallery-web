import { getDashboardStats } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const stats = await getDashboardStats();
    return Response.json({ ok: true, data: stats });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت آمار داشبورد" },
      { status: 500 }
    );
  }
}
