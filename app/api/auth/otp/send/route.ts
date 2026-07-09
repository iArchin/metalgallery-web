import { requestOtp } from "@/lib/server/otp";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

// Each send costs a real SMS. otp.ts already enforces a 60s cooldown per phone,
// but a caller can rotate phone numbers freely, so cap by origin IP too.
const SEND_LIMIT = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000;

/** Request an OTP for a phone number (used by both customer and admin login). */
export async function POST(req: Request) {
  const limit = rateLimit(`otp:send:${clientIp(req)}`, SEND_LIMIT, SEND_WINDOW_MS);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: { phone?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const result = await requestOtp(body?.phone);
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error, cooldown: result.cooldown },
      { status: result.cooldown ? 429 : 400 }
    );
  }

  // devCode is present only in development when no SMS provider is configured.
  return Response.json({ ok: true, data: { sent: true, devCode: result.devCode } });
}
