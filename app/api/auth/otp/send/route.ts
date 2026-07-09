import { requestOtp } from "@/lib/server/otp";

/** Request an OTP for a phone number (used by both customer and admin login). */
export async function POST(req: Request) {
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
