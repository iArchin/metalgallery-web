import { verifyOtp } from "@/lib/server/otp";
import {
  findAdminByPhone,
  setSessionCookie,
  findOrCreateCustomer,
  setCustomerSessionCookie,
} from "@/lib/server/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

// otp.ts burns a code after 5 wrong tries, but a 5-digit code is only 100k
// combinations and codes are re-requestable. Cap guesses per origin IP.
const VERIFY_LIMIT = 20;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

/**
 * Verify an OTP and open a session. `scope: "admin"` restricts login to phones
 * registered to an admin; anything else logs in (or creates) a customer.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`otp:verify:${clientIp(req)}`, VERIFY_LIMIT, VERIFY_WINDOW_MS);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

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
