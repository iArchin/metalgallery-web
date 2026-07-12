import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { otps } from "./schema";
import { SESSION_SECRET as SECRET } from "./secret";

/**
 * Phone + OTP core, shared by the customer and admin login flows.
 *
 * Codes are stored hashed (never in plaintext) in the `otps` table, one row per
 * canonical phone, with a short TTL, a resend cooldown and a max-attempts cap.
 * Delivery goes through SMS.ir over TWO paths at once — a dedicated line for
 * speed and the verify template for reach (see sendVerifySms for why both are
 * required). When no provider is configured the code is logged to the server
 * console instead (dev fallback).
 */

// The verify path rides SMS.ir's shared service line, which has taken 1–10
// minutes to hand this account's messages to the carrier. The TTL must outlive
// that queue WITH margin — hand-off is not handset delivery, and the user
// still has to type the code — so 15 minutes against an observed 10-minute
// worst case. At the old 2 minutes, a code served by the verify path was
// usually dead on arrival. Brute force doesn't get cheaper with a longer TTL —
// a code burns after MAX_ATTEMPTS wrong tries regardless.
const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 120 * 1000; // one code per phone per 2 minutes
const MAX_ATTEMPTS = 5; // wrong tries before a code is burned
const CODE_LENGTH = 5;

/* --------------------------------------------------------------- helpers */

/** Convert Persian/Arabic-Indic digits to ASCII. */
function toAsciiDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalize an Iranian mobile number to canonical `09xxxxxxxxx`, or null. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = toAsciiDigits(input).replace(/[\s\-()]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.startsWith("9") && s.length === 10) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${SECRET}`).digest("hex");
}

function codesMatch(phone: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(phone, code));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

function generateCode(): string {
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH;
  return String(randomInt(min, max));
}

/* ---------------------------------------------------------- SMS delivery */

interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Fast path: a plain message over our dedicated line (/send/bulk). Lands in
 * seconds — but the dedicated lines on this account are ADVERTISING lines
 * (تبلیغاتی), and the carrier silently drops anything an advertising line
 * sends to a number on the national promotional-SMS opt-out list. SMS.ir still
 * answers status 1; only the delivery report betrays the drop (deliveryState 7,
 * "blacklist" — confirmed 2026-07-12 in this account's report: every send to an
 * opted-out number over 30002108025761/50003181890144 shows state 7 and no
 * handset receipt, while the same text reaches a non-opted-out number in 3s).
 * So this path alone can never serve login for opted-out users; sendVerifySms
 * fires the verify template alongside it until the line is upgraded to a
 * SERVICE line (خدماتی) with SMS.ir.
 */
async function sendViaLine(
  mobile: string,
  code: string,
  apiKey: string,
  lineNumber: string
): Promise<SendResult> {
  // No URL in the default: Iranian carriers filter SMS containing a link on a
  // non-service line, so "metalgallery.ir" in the body silently dropped every
  // code (verified: the same message without the URL delivered, with it did
  // not). Keep any override URL-free too.
  const template = process.env.SMS_IR_OTP_MESSAGE || "کد ورود متال گالری: {code}";
  const messageText = template.replace("{code}", code);
  try {
    const res = await fetch("https://api.sms.ir/v1/send/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      // Node sends this JSON as UTF-8, so the Persian text is not mangled.
      body: JSON.stringify({
        lineNumber: Number(lineNumber),
        messageText,
        mobiles: [mobile],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const json = (await res.json().catch(() => null)) as { status?: number; message?: string } | null;
    if (!res.ok || !json || json.status !== 1) {
      console.error("[OTP] SMS.ir bulk error:", res.status, json);
      return { ok: false, error: json?.message || `خطای سرویس پیامک (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[OTP] SMS.ir bulk request failed:", err);
    return { ok: false, error: "خطا در ارتباط با سرویس پیامک" };
  }
}

/**
 * Reach path: the approved verify template on SMS.ir's shared SERVICE line
 * (/send/verify). A service line reaches every number, including opted-out
 * ones — but this account's messages ride a shared queue that has taken 1–10
 * minutes, which is why OTP_TTL_MS is sized to survive it and why the
 * dedicated line above exists at all.
 */
async function sendViaVerifyTemplate(
  mobile: string,
  code: string,
  apiKey: string,
  templateId: number
): Promise<SendResult> {
  const paramName = process.env.SMS_IR_PARAM_NAME || "Code";
  try {
    const res = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId,
        parameters: [{ name: paramName, value: code }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const json = (await res.json().catch(() => null)) as { status?: number; message?: string } | null;
    if (!res.ok || !json || json.status !== 1) {
      console.error("[OTP] SMS.ir verify error:", res.status, json);
      return { ok: false, error: json?.message || `خطای سرویس پیامک (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[OTP] SMS.ir verify request failed:", err);
    return { ok: false, error: "خطا در ارتباط با سرویس پیامک" };
  }
}

/**
 * Send the code over BOTH configured paths in parallel, with the SAME code in
 * each. Neither path alone covers everyone: the dedicated line is fast but the
 * carrier drops it for opted-out numbers, and the verify template reaches
 * everyone but can take minutes. Whichever SMS lands first wins; the other is
 * a harmless duplicate. Success means at least one path was accepted.
 */
async function sendVerifySms(mobile: string, code: string): Promise<SendResult> {
  const apiKey = process.env.SMS_IR_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "سرویس پیامک پیکربندی نشده است" };
  }

  const paths: string[] = [];
  const sends: Promise<SendResult>[] = [];
  const lineNumber = process.env.SMS_IR_LINE_NUMBER;
  if (lineNumber) {
    paths.push("line");
    sends.push(sendViaLine(mobile, code, apiKey, lineNumber));
  }
  const templateId = Number(process.env.SMS_IR_TEMPLATE_ID);
  if (Number.isFinite(templateId) && templateId > 0) {
    paths.push("verify");
    sends.push(sendViaVerifyTemplate(mobile, code, apiKey, templateId));
  }
  if (sends.length === 0) {
    return { ok: false, error: "سرویس پیامک پیکربندی نشده است" };
  }

  const results = await Promise.all(sends);
  const accepted = results.find((r) => r.ok);
  // A partial failure still counts as sent, but say so LOUDLY: if the verify
  // path is the broken one, numbers on the ad-SMS opt-out list are receiving
  // nothing at all — the exact outage this dual-send exists to prevent — while
  // every login attempt reports success.
  if (accepted && results.some((r) => !r.ok)) {
    const failed = paths.filter((_, i) => !results[i].ok).join(", ");
    console.error(
      `[OTP] PARTIAL SEND: ${failed} path failed — if verify is down, opted-out numbers get NO code`
    );
  }
  return accepted ?? results[0];
}

/* -------------------------------------------------------------- requests */

export interface RequestOtpResult {
  ok: boolean;
  error?: string;
  cooldown?: number; // seconds until a resend is allowed (on cooldown error)
  devCode?: string; // dev only: the code, when no SMS provider is configured
}

export async function requestOtp(rawPhone: unknown): Promise<RequestOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست" };

  const now = Date.now();
  const code = generateCode();
  const isDev = process.env.NODE_ENV !== "production";
  const hasProvider = Boolean(process.env.SMS_IR_API_KEY);

  // Sweep expired rows first so a dead row can't hold a phone's cooldown.
  await db.delete(otps).where(lt(otps.expiresAt, new Date(now)));

  // Atomically claim the right to send: one upsert whose UPDATE only applies
  // once the cooldown has lapsed. Concurrent requests serialize on the row, so
  // exactly one gets RETURNING back and the rest bail into the cooldown error.
  // The old read-check-then-send let simultaneous requests all pass the check
  // and each fire real SMS — visible in the SMS.ir report as duplicate sends
  // in the same second.
  //
  // A still-valid previous code is moved to prev_* rather than destroyed: its
  // SMS may take minutes to deliver (verify path), and a resend must not turn
  // that in-flight message into a wrong-code trap. verifyOtp accepts both.
  const fresh = {
    codeHash: hashCode(phone, code),
    expiresAt: new Date(now + OTP_TTL_MS),
    attempts: 0,
    lastSentAt: new Date(now),
  };
  // ISO strings, not Date objects: params inside sql`` skip the column's
  // driver mapping, and the driver rejects a raw Date there.
  const stillValid = sql`${otps.expiresAt} > ${new Date(now).toISOString()}`;
  const claimed = await db
    .insert(otps)
    .values({ phone, ...fresh })
    .onConflictDoUpdate({
      target: otps.phone,
      set: {
        ...fresh,
        // In ON CONFLICT SET, plain column references read the EXISTING row.
        prevCodeHash: sql`case when ${stillValid} then ${otps.codeHash} else null end`,
        prevExpiresAt: sql`case when ${stillValid} then ${otps.expiresAt} else null end`,
      },
      setWhere: sql`${otps.lastSentAt} <= ${new Date(now - RESEND_COOLDOWN_MS).toISOString()}`,
    })
    .returning({ phone: otps.phone });
  if (claimed.length === 0) {
    const [existing] = await db.select().from(otps).where(eq(otps.phone, phone));
    const lastSentAt = existing?.lastSentAt.getTime() ?? now;
    const cooldown = Math.max(1, Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000));
    return { ok: false, error: `تا ${cooldown} ثانیه دیگر می‌توانید کد جدید بگیرید`, cooldown };
  }

  const send = await sendVerifySms(phone, code);
  // Production must actually deliver the SMS. In dev we continue regardless (the
  // provider may be unreachable, or SMS.ir sandbox mode doesn't deliver a real
  // message) and surface the code so the flow is testable.
  if (!send.ok && !isDev) {
    // Release the claim: a send that never happened must not cost the user a
    // full cooldown. The fresh (undelivered) code stays in the row — harmless,
    // and the retry overwrites it.
    await db.update(otps).set({ lastSentAt: new Date(0) }).where(eq(otps.phone, phone));
    return { ok: false, error: send.error ?? "ارسال پیامک ناموفق بود" };
  }
  if (isDev) console.warn(`[OTP] code for ${phone}: ${code}${send.ok ? "" : " (SMS not delivered)"}`);

  // Echo the code back to the browser only when there is no SMS provider at all
  // — i.e. nothing could have delivered it. Once SMS_IR_API_KEY is configured the
  // app behaves like production and the code stays server-side (console only),
  // so a misread NODE_ENV can never turn the login form into a code oracle.
  return { ok: true, devCode: isDev && !hasProvider ? code : undefined };
}

export interface VerifyOtpResult {
  ok: boolean;
  phone?: string; // canonical phone on success
  error?: string;
}

export async function verifyOtp(rawPhone: unknown, rawCode: unknown): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست" };
  const code = toAsciiDigits(String(rawCode ?? "")).replace(/\D/g, "");
  if (!code) return { ok: false, error: "کد تایید را وارد کنید" };

  // One transaction with the row locked FOR UPDATE, so two concurrent verify
  // attempts can't both slip past the attempt cap.
  return db.transaction(async (tx): Promise<VerifyOtpResult> => {
    const now = new Date();
    const [rec] = await tx.select().from(otps).where(eq(otps.phone, phone)).for("update");
    if (!rec || rec.expiresAt < now) {
      return { ok: false, error: "کد منقضی شده است. دوباره درخواست دهید" };
    }
    if (rec.attempts >= MAX_ATTEMPTS) {
      await tx.delete(otps).where(eq(otps.phone, phone));
      return { ok: false, error: "تعداد تلاش‌ها زیاد است. دوباره درخواست دهید" };
    }
    // The current code, or the previous one while it is itself unexpired — the
    // previous code's SMS may arrive minutes after a resend replaced it, and
    // the user will type whichever lands first.
    const matches =
      codesMatch(phone, code, rec.codeHash) ||
      (rec.prevCodeHash !== null &&
        rec.prevExpiresAt !== null &&
        rec.prevExpiresAt >= now &&
        codesMatch(phone, code, rec.prevCodeHash));
    if (!matches) {
      await tx.update(otps).set({ attempts: rec.attempts + 1 }).where(eq(otps.phone, phone));
      return { ok: false, error: "کد تایید نادرست است" };
    }
    await tx.delete(otps).where(eq(otps.phone, phone)); // one-time use
    return { ok: true, phone };
  });
}
