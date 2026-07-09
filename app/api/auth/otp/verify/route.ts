import { verifyOtp } from "@/lib/server/otp";
import {
  findAdminByPhone,
  setSessionCookie,
  findOrCreateCustomer,
  setCustomerSessionCookie,
} from "@/lib/server/auth";

/**
 * Verify an OTP and open a session. `scope: "admin"` restricts login to phones
 * registered to an admin; anything else logs in (or creates) a customer.
 */
export async function POST(req: Request) {
  let body: { phone?: unknown; code?: unknown; scope?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const scope = body?.scope === "admin" ? "admin" : "user";
  const result = await verifyOtp(body?.phone, body?.code);
  if (!result.ok || !result.phone) {
    return Response.json({ ok: false, error: result.error ?? "کد تایید نادرست است" }, { status: 400 });
  }
  const phone = result.phone;

  if (scope === "admin") {
    const admin = await findAdminByPhone(phone);
    if (!admin) {
      return Response.json(
        { ok: false, error: "این شماره دسترسی مدیریت ندارد" },
        { status: 403 }
      );
    }
    await setSessionCookie(admin.id);
    return Response.json({ ok: true, data: { role: "admin", name: admin.name } });
  }

  const customer = await findOrCreateCustomer(phone);
  await setCustomerSessionCookie(customer.id);
  return Response.json({
    ok: true,
    data: { role: "user", id: customer.id, phone: customer.phone, name: customer.name },
  });
}
